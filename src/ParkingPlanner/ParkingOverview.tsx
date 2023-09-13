import { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import { v4 as uuidv4 } from 'uuid';
import { Flight, ParkingArea } from "../API/parkingPlanningAPI";
import { get } from "../API/util";
import "./ParkingOverview.scss";
import ParkingChart from './ParkingChart';
import ParkingScheduler from './ParkingScheduler';
import "react-datepicker/dist/react-datepicker.css";

export default function ParkingOverview() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [selectedDateValue, setSelectedDateValue] = useState<Date | null>(new Date());
  const [errors, setErrors] = useState<string>();
  const [requestUUID, setRequestUUID] = useState(uuidv4());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    get({
      handleDone: (r: Flight[]) => setFlights(r),
      handleFail: (r) => setErrors(r),
      handleFinally: () => setIsLoading(false),
      route: "flights",
    });
    get({
      handleDone: (r) => setParkingAreas(r),
      handleFail: (r) => setErrors(r),
      handleFinally: () => setIsLoading(false),
      route: "parkingareas",
    });
  }, [requestUUID]);
  return (
    <div className='parking-overview'>
      <h2>Flight Parking Scheduler</h2>
      <DatePicker onChange={setSelectedDateValue} selected={selectedDateValue} />
      <ParkingScheduler parkingAreas={parkingAreas} selectedDateValue={selectedDateValue} setRequestUUID={setRequestUUID} />
      {!isLoading && !errors && flights?.length && parkingAreas?.length ?
        <ParkingChart flights={flights} parkingAreas={parkingAreas} selectedDateValue={selectedDateValue} />
        : errors
          ? errors
          : 'loading chart...'
      }
  </div>
  );
}
