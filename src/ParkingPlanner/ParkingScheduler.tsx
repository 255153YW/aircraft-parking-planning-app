import { useState, useMemo, useCallback, SyntheticEvent } from 'react';
import DatePicker from "react-datepicker";
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns'
import { ParkingArea, ParkingSpot } from "../API/parkingPlanningAPI";
import { post } from "../API/util";
import "./ParkingOverview.scss";
import "react-datepicker/dist/react-datepicker.css";

interface ParkingSchedulerProps {
  parkingAreas: Array<ParkingArea>;
  selectedDateValue?: Date | null;
  setRequestUUID: Function;
}
export default function ParkingScheduler({ parkingAreas, selectedDateValue, setRequestUUID }: ParkingSchedulerProps) {
  const [registrationCode, setRegistrationCode] = useState('');
  const [aircraftType, setAircraftType] = useState('');
  const [footprintSqm, setFootprintSqm] = useState('');
  const [selectedParkingSpotIndex, setSelectedParkingSpotIndex] = useState('');
  const [startDateTimeValue, setStartDateTimeValue] = useState<Date | null>();
  const [endDateTimeValue, setEndDateTimeValue] = useState<Date | null>();
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [errors, setErrors] = useState('');


  const parkingSpots = useMemo((): Array<ParkingSpot> => {
    let pSpots: Array<ParkingSpot> = [];
    parkingAreas.forEach(pArea => {
      if (pArea.parkingSpots) {
        pSpots = pSpots.concat(pArea.parkingSpots)
      }
    });
    return pSpots;
  }, [parkingAreas]);

  const renderParkingSpotOptions = useCallback(() => parkingSpots.map((pSpot, index) => {
    const { name: pSpotName, footprintSqm } = pSpot;
    return (
      <option value={index}>{pSpotName} - {footprintSqm}m2</option>
    )
  }), [parkingSpots]);

  const clearFormData = () => {
    setRegistrationCode('');
    setAircraftType('');
    setFootprintSqm('');
    setSelectedParkingSpotIndex('');
    setStartDateTimeValue(null)
    setEndDateTimeValue(null)
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    setIsFormDisabled(true);
    post({
      handleDone: (r) => {
        clearFormData();
        setRequestUUID(uuidv4())
      },
      handleFail: (r) => {
        setErrors(r);
      },
      handleFinally: () => {
        setIsFormDisabled(false);
      },
      data: JSON.stringify({
        id: uuidv4(),
        aircraft: {
          registrationCode,
          footprintSqm,
          aircraftType,
        },
        parkingSpot: parkingSpots[Number(selectedParkingSpotIndex)],
        startDateTime: format(startDateTimeValue||new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        endDateTime: format(endDateTimeValue || new Date(), "yyyy-MM-dd'T'HH:mm:ss")
      }),
      route: "flights",
    });
  }

  return (
    <form className='scheduler' onSubmit={handleSubmit}>
      <p>Aircraft Info</p>
      <input value={registrationCode} onChange={e => setRegistrationCode(e.target.value)} placeholder='registration code' disabled={isFormDisabled} required />
      <input value={aircraftType} onChange={e => setAircraftType(e.target.value)} placeholder='aircraft type' disabled={isFormDisabled} required />
      <input value={footprintSqm} type='number' onChange={e => setFootprintSqm(e.target.value)} placeholder='footprint (m2)' disabled={isFormDisabled} required />

      <p>Parking Spot</p>
      <select
        value={selectedParkingSpotIndex}
        onChange={e => setSelectedParkingSpotIndex(e.target.value)}
        disabled={isFormDisabled}
        required
      >
        <option value=''>-- Select Parking Spot --</option>
        {renderParkingSpotOptions()}
      </select>

      <p>Start Date</p>
      <DatePicker onChange={setStartDateTimeValue} selected={startDateTimeValue} showTimeSelect dateFormat="Pp" disabled={isFormDisabled} required />

      <p>End Date</p>
      <DatePicker onChange={setEndDateTimeValue} selected={endDateTimeValue} showTimeSelect dateFormat="Pp" disabled={isFormDisabled} required />
      <p></p>
      <input type="submit" value="Submit" disabled={isFormDisabled} />
      {errors &&
        <p>{errors}</p>
      }
    </form>
  );
}
