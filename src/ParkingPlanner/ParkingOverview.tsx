import { useState, useEffect, useMemo, useCallback, ReactElement } from 'react';
import DatePicker from "react-datepicker";
import { Chart } from "react-google-charts";
import { Flight, ParkingArea, ParkingSpot } from "../API/parkingPlanningAPI";
import { get } from "../API/util";
import "./ParkingOverview.scss";
import "react-datepicker/dist/react-datepicker.css";

interface P {}

export default function ParkingOverview(props: P) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [parkingareas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [selectedDateValue, setSelectedDateValue] = useState<Date|null>(new Date('2023-01-02'));
  const [selectedMode, setSelectedMode] = useState<string>('day');

  const parkingSpots = useMemo((): Array<ParkingSpot> => {
    let pSpots: Array<ParkingSpot> = [];
    parkingareas.forEach(pArea => {
      if (pArea.parkingSpots) {
        pSpots = pSpots.concat(pArea.parkingSpots)
      }
    });
    return pSpots;
  }, [parkingareas])

  const parkedFlightsDictionary = useMemo((): Map<string, Array<Flight>> => {
    const dictionary = new Map<string, Array<Flight>>();
    flights.forEach(flight => {
      const { parkingSpot, startDateTime, endDateTime } = flight;
      if (selectedDateValue && parkingSpot && startDateTime && endDateTime) {
        const startDateValue = new Date(startDateTime);
        const endDateValue = new Date(endDateTime);
        const { name: pSpotName } = parkingSpot;
        if (pSpotName && (endDateValue >= selectedDateValue) && (startDateValue <= new Date(selectedDateValue.getTime() + 24 * 60 * 60 * 1000))) {
          const currentDictValue = dictionary.get(pSpotName);
          if (!currentDictValue) {
            dictionary.set(pSpotName, [flight]);
          } else {
            dictionary.set(pSpotName, currentDictValue.concat([flight]));
          }
        }
      }
    });
    return dictionary;
  }, [flights, selectedDateValue])

  const chartData = useMemo(() => {
    const data: Array<any> = [];
    data.push([
      { type: "string", id: "Position" },
      { type: "string", id: "Name" },
      { type: 'string', role: 'style' },
      { type: "date", id: "Start" },
      { type: "date", id: "End" },
    ]);
    parkingSpots.forEach(pSpot => {
      const { name: pSpotName } = pSpot;
      if (pSpotName) {
        const pSpotFlights = parkedFlightsDictionary.get(pSpotName);
        if (pSpotFlights) {
          pSpotFlights.forEach(pSpotFlight => {
            const { aircraft, endDateTime, startDateTime } = pSpotFlight;
            if (startDateTime && endDateTime) {
              data.push([
                pSpotName,
                aircraft?.registrationCode,
                null,
                new Date(startDateTime),
                new Date(endDateTime)
              ]);
            }
          })
        } else if (selectedDateValue) {
          data.push([
            pSpotName,
            '',
            'opacity: 0;',
            selectedDateValue,
            selectedDateValue
          ]);
        }
      }
    })
    return data;
  }, [flights, parkingSpots, parkedFlightsDictionary, selectedDateValue])

  useEffect(() => {
    get({
      handleDone: (r: Flight[]) => setFlights(r),
      handleFail: (r) => console.error(r),
      route: "flights",
    });
    get({
      handleDone: (r) => setParkingAreas(r),
      handleFail: (r) => console.error(r),
      route: "parkingareas",
    });
  }, []);

  const alignLeft: React.CSSProperties = { textAlign: "left" };
  const alignRight: React.CSSProperties = { textAlign: "right" };
  console.log("!!!parking_areas", parkingareas)
  console.log("!!!flights", flights)
  return (
    <>
      <div>
      <header style={alignLeft}>{"Parking areas:"}</header>
      <div role={"list"} style={alignRight}>
        {parkingareas?.map((p) => (
            <div>{p.name}</div>
        ))}
      </div>
      <header style={alignLeft}>{"Flights:"}</header>
      <div style={alignRight}>
        {flights?.map((p) => (
            <div>{p.parkingSpot?.name + ": " + p.aircraft?.registrationCode}</div>
        ))}
      </div>
      </div>
      <DatePicker onChange={setSelectedDateValue} selected={selectedDateValue} />
      <div className='parking-overview'>
        <Chart chartType="Timeline" data={chartData} height='26em' />
      </div>
  </>
  );
}
