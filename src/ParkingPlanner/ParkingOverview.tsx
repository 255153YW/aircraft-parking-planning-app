import { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import { Flight, ParkingArea } from "../API/parkingPlanningAPI";
import { get } from "../API/util";
import "./ParkingOverview.scss";
import "react-datepicker/dist/react-datepicker.css";
import ParkingChart from './ParkingChart';
import ParkingScheduler from './ParkingScheduler';

export default function ParkingOverview() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
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
      <h2>Flight Parking Scheduler</h2>
      <DatePicker onChange={setSelectedDateValue} selected={selectedDateValue} />
      <ParkingScheduler parkingAreas={parkingAreas} selectedDateValue={selectedDateValue} />
      {flights?.length && parkingAreas?.length ?
        <ParkingChart flights={flights} parkingAreas={parkingAreas} selectedDateValue={selectedDateValue} />
        : errors
          ? errors
          : 'loading...'
      }
  </div>
  );
}
