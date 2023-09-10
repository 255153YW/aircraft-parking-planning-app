import { useState, useEffect, useMemo, SyntheticEvent } from 'react';
import DatePicker from "react-datepicker";
import { Flight, ParkingArea, ParkingSpot } from "../API/parkingPlanningAPI";
import { get } from "../API/util";
import "./ParkingOverview.scss";
import "react-datepicker/dist/react-datepicker.css";

interface ParkingSchedulerProps {
  parkingAreas: Array<ParkingArea>;
  selectedDateValue?: Date | null;
}
export default function ParkingScheduler({ parkingAreas, selectedDateValue }: ParkingSchedulerProps) {
  const [registrationCode, setRegistrationCode] = useState('');
  const [type, setType] = useState('');
  const [footprint, setFootprint] = useState('0');
  const [selectedParkingSpot, setSelectedParkingSpot] = useState('');
  const [startDateValue, setStartDateValue] = useState<Date | null>();
  const [endDateValue, setEndDateValue] = useState<Date | null>();
  const [isFormDisabled, setIsFormDisabled] = useState(false);

  const parkingSpots = useMemo((): Array<ParkingSpot> => {
    let pSpots: Array<ParkingSpot> = [];
    parkingAreas.forEach(pArea => {
      if (pArea.parkingSpots) {
        pSpots = pSpots.concat(pArea.parkingSpots)
      }
    });
    return pSpots;
  }, [parkingAreas]);

  const renderParkingSpotOptions = () => parkingSpots.map((pSpot) => {
    const { name: pSpotName } = pSpot;
    return (
      <option value={pSpotName}>{pSpotName}</option>
    )
  });

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    setIsFormDisabled(true);

  }

  return (
    <form className='scheduler' onSubmit={handleSubmit}>
      <p>Aircraft Info</p>
      <input value={registrationCode} onChange={e => setRegistrationCode(e.target.value)} placeholder='registration code' disabled={isFormDisabled} required />
      <input value={type} onChange={e => setType(e.target.value)} placeholder='aircraft type' disabled={isFormDisabled} required />
      <input value={footprint} type='number' onChange={e => setFootprint(e.target.value)} placeholder='footprint (m2)' disabled={isFormDisabled} required />

      <p>Parking Spot</p>
      <select
        value={selectedParkingSpot}
        onChange={e => setSelectedParkingSpot(e.target.value)}
        disabled={isFormDisabled}
        required
      >
        {renderParkingSpotOptions()}
      </select>

      <p>Start Date</p>
      <DatePicker onChange={setStartDateValue} selected={startDateValue} showTimeSelect dateFormat="Pp" disabled={isFormDisabled} required />

      <p>End Date</p>
      <DatePicker onChange={setEndDateValue} selected={endDateValue} showTimeSelect dateFormat="Pp" disabled={isFormDisabled} required />
      <p></p>
      <input type="submit" value="Submit" disabled={isFormDisabled} />
    </form>
  );
}
