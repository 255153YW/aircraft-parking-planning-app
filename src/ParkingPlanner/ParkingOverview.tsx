import { useState, useEffect, useMemo } from 'react';
import DatePicker from "react-datepicker";
import { Chart } from "react-google-charts";
import { Flight, ParkingArea, ParkingSpot, Aircraft } from "../API/parkingPlanningAPI";
import { get } from "../API/util";
import "./ParkingOverview.scss";
import "react-datepicker/dist/react-datepicker.css";
import ParkingChart from './ParkingChart';

export default function ParkingOverview() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [parkingareas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [selectedDateValue, setSelectedDateValue] = useState<Date | null>(new Date());
  const [errors, setErrors] = useState<string>();

  useEffect(() => {
    get({
      handleDone: (r: Flight[]) => setFlights(r),
      handleFail: (r) => setErrors(r),
      route: "flights",
    });
    get({
      handleDone: (r) => setParkingAreas(r),
      handleFail: (r) => setErrors(r),
      route: "parkingareas",
    });
  }, []);

  return (
    <div className='parking-overview'>
      <DatePicker onChange={setSelectedDateValue} selected={selectedDateValue} />
      {flights?.length && parkingareas?.length ?
        <ParkingChart flights={flights} parkingAreas={parkingareas} selectedDateValue={selectedDateValue} />
        : errors
          ? errors
          : 'loading...'
      }
  </div>
  );
}
