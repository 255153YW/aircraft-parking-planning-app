import { useMemo, useState, useEffect, useContext } from 'react';
import { Chart, ReactGoogleChartEvent } from "react-google-charts";
import { Flight, ParkingArea, ParkingSpot, Aircraft } from "../API/parkingPlanningAPI";
import "./ParkingOverview.scss";
import "react-datepicker/dist/react-datepicker.css";
import { DATA_TABLE_ROW_INDEX_UPDATE, DATA_TABLE_ROW_MAP_UPDATE, ParkingPlannerContext, SELECTED_FLIGHT_UPDATE } from './ParkingPlannerContext';

interface ParkingChartProps {
  flights:Array<Flight>;
  parkingAreas: Array<ParkingArea>;
  selectedDateValue?: Date | null;
}

export default function ParkingChart({ flights, parkingAreas, selectedDateValue }: ParkingChartProps) {
  const [dataTableRowFlightMap, setDataTableRowFlightMap] = useState<Array<Flight | null> | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const { dispatch } = useContext(ParkingPlannerContext);

  const selectedDateWithoutOffset = useMemo(() => {
    let dateToConvert = new Date();
    if (selectedDateValue) {
      dateToConvert = selectedDateValue;
    }
    return new Date(dateToConvert.getFullYear(), dateToConvert.getMonth(),
      dateToConvert.getDate());
  }, [selectedDateValue]);


  const getUTCDate = (dateStringOrMiliseconds: string | number): Date => {
    const dateFromString = new Date(dateStringOrMiliseconds);
    return new Date(Date.UTC(dateFromString.getUTCFullYear(), dateFromString.getUTCMonth(),
      dateFromString.getUTCDate(), dateFromString.getUTCHours(),
      dateFromString.getUTCMinutes(), dateFromString.getUTCSeconds()));
  }

  const parkingSpots = useMemo((): Array<ParkingSpot> => {
    let pSpots: Array<ParkingSpot> = [];
    parkingAreas.forEach(pArea => {
      if (pArea.parkingSpots) {
        pSpots = pSpots.concat(pArea.parkingSpots)
      }
    });
    return pSpots;
  }, [parkingAreas]);

  const parkedFlightsDictionary = useMemo((): Map<string, Array<Flight>> => {
    const dictionary = new Map<string, Array<Flight>>();
    flights.forEach(flight => {
      const { parkingSpot, startDateTime, endDateTime } = flight;
      if (selectedDateWithoutOffset && parkingSpot && startDateTime && endDateTime) {
        const startDateValue = getUTCDate(startDateTime);
        const endDateValue = getUTCDate(endDateTime);
        const { name: pSpotName } = parkingSpot;
        if ((endDateValue >= selectedDateWithoutOffset) && (startDateValue <= new Date(selectedDateWithoutOffset.getTime() + (24 * 60 * 60 * 1000)))) {
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
  }, [flights, selectedDateWithoutOffset]);

  const customHTMLTooltip = (aircraft: Aircraft | null | undefined, pSpot: ParkingSpot, startDateTime: string | undefined, endDateTime: string | undefined) => {
    const { registrationCode, aircraftType, footprintSqm } = aircraft || {};
    const { name: pSpotName, footprintSqm: pFootprintSqm } = pSpot;
    return (
      '<div class="tooltip">' +
      '<div>' + registrationCode + '</div>' +
      '<div>' + aircraftType + ' - ' + footprintSqm + 'm2 </div>' +
      '<div>' + pSpotName + '</div>' +
      '<div>' + pFootprintSqm + 'm2 </div>' +
      '<div>' + startDateTime + '</div>' +
      '<div>' + endDateTime + '</div>' +
      '</div>'
    );
  }

  const emptyHtmlTooltip = (pSpot: ParkingSpot) => {
    const { name: pSpotName, footprintSqm: pFootprintSqm } = pSpot;
    return (
      '<div class="tooltip">' +
      '<div>' + pSpotName + '</div>' +
      '<div>' + pFootprintSqm + 'm2 </div>' +
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
    setDataTableRowFlightMap(null);
    const flightRowMap:Array<Flight|null> = [];
    parkingSpots.forEach(pSpot => {
      const { name: pSpotName } = pSpot;
      if (selectedDateWithoutOffset) {
        const pSpotFlights = parkedFlightsDictionary.get(pSpotName);
        if (pSpotFlights) {
          pSpotFlights.forEach(pSpotFlight => {
            const { aircraft, endDateTime, startDateTime } = pSpotFlight;

            if (startDateTime && endDateTime) {
              const startTimeValue = getUTCDate(startDateTime);
              const endTimeValue = getUTCDate(endDateTime);
              const endOfSelectedDay = new Date(selectedDateWithoutOffset.getTime() + (24 * 60 * 60 * 1000))
              const startOfSelectedDay = selectedDateWithoutOffset;
              let adjustedStartTime = startTimeValue;
              let adjustedEndTime = endTimeValue;

              if (endOfSelectedDay < endTimeValue) {
                adjustedEndTime = endOfSelectedDay;
              }
              if (startOfSelectedDay > startTimeValue) {
                adjustedStartTime = startOfSelectedDay;
              }
              flightRowMap.push(pSpotFlight);
              data.push([
                pSpotName,
                `${aircraft?.registrationCode} - ${aircraft?.aircraftType} - ${aircraft?.footprintSqm}m2`,
                customHTMLTooltip(aircraft, pSpot, startDateTime, endDateTime),
                null,
                adjustedStartTime,
                adjustedEndTime,
              ]);
            }
          })
        } else {
          flightRowMap.push(null);
          data.push([
            pSpotName,
            '',
            emptyHtmlTooltip(pSpot),
            'opacity: 0;',
            selectedDateWithoutOffset,
            new Date(selectedDateWithoutOffset.getTime() + (24 * 60 * 60 * 1000)),
          ]);
        }
      }
    });
    setDataTableRowFlightMap(flightRowMap);
    return data;
  }, [parkingSpots, parkedFlightsDictionary, selectedDateWithoutOffset]);

  const chartEvents = useMemo((): ReactGoogleChartEvent[] => [
      {
          eventName: "select",
          callback: ({ chartWrapper }) => {
              const chart = chartWrapper.getChart();
              const selection = chart.getSelection();
              if (selection.length === 1) {
                  const [selectedItem] = selection;
                  const { row } = selectedItem;
                  setSelectedRowIndex(row);
              }
          },
      },
  ], [setSelectedRowIndex]);

  useEffect(() => {
    if (dataTableRowFlightMap) {
      dispatch({ type: DATA_TABLE_ROW_MAP_UPDATE, dataTableRowFlightMapUpdate: dataTableRowFlightMap });
      if (selectedRowIndex > -1) {
        dispatch({ type: DATA_TABLE_ROW_INDEX_UPDATE, dataTableRowIndexUpdate: selectedRowIndex });
        dispatch({ type: SELECTED_FLIGHT_UPDATE, selectedFlightUpdate: dataTableRowFlightMap[selectedRowIndex] });
      }
    }
  }, [dataTableRowFlightMap, dispatch, selectedRowIndex]);

  const timelineChart = useMemo(() => {
    return <Chart chartType="Timeline" data={chartData} height='40em' width='99vw' chartEvents={chartEvents} />
  }, [chartData, chartEvents]);

  return (
    <div className='chart'>
      {timelineChart}
    </div>
  );
}
