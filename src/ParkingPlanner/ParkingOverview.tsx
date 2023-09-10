import { useState, useEffect, useMemo } from 'react';
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
  const [selectedDateValue, setSelectedDateValue] = useState<Date | null>(new Date());

  const selectedDateWithoutOffset = useMemo(() => {
    let dateToConvert = new Date();
    if (selectedDateValue) {
      dateToConvert = selectedDateValue;
    }
    return new Date(dateToConvert.getFullYear(), dateToConvert.getMonth(),
      dateToConvert.getDate());
  }, [selectedDateValue])


  const getUTCDate = (dateStringOrMiliseconds: string | number): Date => {
    const dateFromString = new Date(dateStringOrMiliseconds);
    return new Date(Date.UTC(dateFromString.getUTCFullYear(), dateFromString.getUTCMonth(),
      dateFromString.getUTCDate(), dateFromString.getUTCHours(),
      dateFromString.getUTCMinutes(), dateFromString.getUTCSeconds()));
  }

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
      if (selectedDateWithoutOffset && parkingSpot && startDateTime && endDateTime) {
        const startDateValue = getUTCDate(startDateTime);
        const endDateValue = getUTCDate(endDateTime);
        const { name: pSpotName } = parkingSpot;
        if (pSpotName && (endDateValue >= getUTCDate(selectedDateWithoutOffset.getTime() - (1 * 60 * 60 * 1000))) && (startDateValue <= getUTCDate(selectedDateWithoutOffset.getTime() + (23 * 60 * 60 * 1000)))) {
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
  }, [flights, selectedDateWithoutOffset])

  const customHTMLTooltip = (registrationCode: string | null | undefined, pSpotName: string, startDateTime: string | undefined, endDateTime: string | undefined) => {
    return (
      '<div class="tooltip">' +
      '<div>' + registrationCode + '</div>' +
      '<div>' + pSpotName + '</div>' +
      '<div>' + startDateTime + '</div>' +
      '<div>' + endDateTime + '</div>' +
      '</div>'
    );
  }

  const emptyHtmlTooltip = (pSpotName: string) => {
    return (
      '<div class="tooltip">' +
      '<div>' + pSpotName + '</div>' +
      '<div>No flight assigned for the day.</div>' +
      '</div>'
    );
  }

  const chartData = useMemo(() => {
    const data: Array<any> = [];
    data.push([
      { type: "string", id: "Position" },
      { type: "string", id: "Name" },
      { type: "string", role: "tooltip", p: { html: true } },
      { type: "string", role: "style" },
      { type: "date", id: "Start" },
      { type: "date", id: "End" },
    ]);
    parkingSpots.forEach(pSpot => {
      const { name: pSpotName } = pSpot;
      if (pSpotName && selectedDateWithoutOffset) {
        const pSpotFlights = parkedFlightsDictionary.get(pSpotName);
        if (pSpotFlights) {
          pSpotFlights.forEach(pSpotFlight => {
            const { aircraft, endDateTime, startDateTime } = pSpotFlight;
           
            if (startDateTime && endDateTime) {
              const startTimeValue = getUTCDate(startDateTime);
              const endTimeValue = getUTCDate(endDateTime);
              const endOfSelectedDay = getUTCDate(selectedDateWithoutOffset.getTime() + (23 * 60 * 60 * 1000))
              const startOfSelectedDay = getUTCDate(selectedDateWithoutOffset.getTime() - (1 * 60 * 60 * 1000))
              let adjustedStartTime = startTimeValue;
              let adjustedEndTime = endTimeValue;

              if (endOfSelectedDay < endTimeValue) {
                adjustedEndTime = endOfSelectedDay;
              }
              if (startOfSelectedDay > startTimeValue) {
                adjustedStartTime = startOfSelectedDay;
              }
              data.push([
                pSpotName,
                `${aircraft?.registrationCode} - ${aircraft?.footprintSqm}m2`,
                customHTMLTooltip(aircraft?.registrationCode, pSpotName, startDateTime, endDateTime),
                null,
                adjustedStartTime,
                adjustedEndTime,
              ]);
            }
          })
        } else {
          data.push([
            pSpotName,
            '',
            emptyHtmlTooltip(pSpotName),
            'opacity: 0;',
            selectedDateWithoutOffset,
            getUTCDate(selectedDateWithoutOffset.getTime() + (23 * 60 * 60 * 1000)),
          ]);
        }
      }
    })
    return data;
  }, [parkingSpots, parkedFlightsDictionary, selectedDateWithoutOffset])

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
  return (
    <div className='parking-overview'>
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
      <div className='chart'>
        <Chart chartType="Timeline" data={chartData} height='40em' />
      </div>
  </div>
  );
}
