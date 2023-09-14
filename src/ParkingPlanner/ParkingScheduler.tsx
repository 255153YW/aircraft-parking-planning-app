import React, { useState, useMemo, useCallback, SyntheticEvent, useContext, useEffect } from 'react';
import DatePicker from "react-datepicker";
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns'
import { ParkingArea, ParkingSpot } from "../API/parkingPlanningAPI";
import { deleteFlight, post } from "../API/util";
import "./ParkingOverview.scss";
import "react-datepicker/dist/react-datepicker.css";
import { ParkingPlannerContext, SELECTED_FLIGHT_UPDATE } from './ParkingPlannerContext';

interface ParkingSchedulerProps {
  parkingAreas: Array<ParkingArea>;
  selectedDateValue?: Date | null;
  setRequestUUID: Function;
}
const ParkingScheduler = ({ parkingAreas, selectedDateValue, setRequestUUID }: ParkingSchedulerProps) => {
  const [registrationCode, setRegistrationCode] = useState('');
  const [aircraftType, setAircraftType] = useState('');
  const [footprintSqm, setFootprintSqm] = useState('');
  const [selectedParkingSpotIndex, setSelectedParkingSpotIndex] = useState('');
  const [startDateTimeValue, setStartDateTimeValue] = useState<Date | null>();
  const [endDateTimeValue, setEndDateTimeValue] = useState<Date | null>();
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [errors, setErrors] = useState('');
  const { parkingPlannerState, dispatch } = useContext(ParkingPlannerContext);


  const parkingSpots = useMemo((): Array<ParkingSpot> => {
    let pSpots: Array<ParkingSpot> = [];
    parkingAreas.forEach(pArea => {
      if (pArea.parkingSpots) {
        pSpots = pSpots.concat(pArea.parkingSpots)
      }
    });
    return pSpots;
  }, [parkingAreas]);

  useEffect(() => {
    const { selectedFlight } = parkingPlannerState;
    if (selectedFlight) {
      const { aircraft, startDateTime, endDateTime, parkingSpot } = selectedFlight;
      if (aircraft && startDateTime && endDateTime && parkingSpot) {
        const { registrationCode, aircraftType, footprintSqm } = aircraft;
        const { name: pSpotName, footprintSqm: pFootprintSqm } = parkingSpot;
        setRegistrationCode(registrationCode || '');
        setAircraftType(aircraftType || '');
        setFootprintSqm(footprintSqm ? footprintSqm.toString() : '0');
        setStartDateTimeValue(new Date(startDateTime));
        setEndDateTimeValue(new Date(endDateTime));
        setSelectedParkingSpotIndex(parkingSpots.findIndex(pSpot => pSpot.name === pSpotName).toString());
      }
    }
  }, [parkingPlannerState, parkingSpots])

  const renderParkingSpotOptions = useCallback(() => parkingSpots.map((pSpot, index) => {
    const { name: pSpotName, footprintSqm:pSpotFootprintSqm } = pSpot;
    return (
      <option value={index} disabled={Number(footprintSqm||0) > pSpotFootprintSqm}>{pSpotName} - {pSpotFootprintSqm}m2</option>
    )
  }), [parkingSpots, footprintSqm]);

  const clearFormData = () => {
    setRegistrationCode('');
    setAircraftType('');
    setFootprintSqm('');
    setSelectedParkingSpotIndex('');
    setStartDateTimeValue(null)
    setEndDateTimeValue(null)
  }

  const handleSubmit = useCallback((e: SyntheticEvent) => {
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
        id: parkingPlannerState?.selectedFlight?.id || uuidv4(),
        aircraft: {
          registrationCode,
          footprintSqm,
          aircraftType,
        },
        parkingSpot: parkingSpots[Number(selectedParkingSpotIndex)],
        startDateTime: format(startDateTimeValue || new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        endDateTime: format(endDateTimeValue || new Date(), "yyyy-MM-dd'T'HH:mm:ss")
      }),
      route: "flights",
      })
    }, [aircraftType, endDateTimeValue, footprintSqm, parkingPlannerState?.selectedFlight?.id, parkingSpots, registrationCode, selectedParkingSpotIndex, setRequestUUID, startDateTimeValue]);

  const handleDelete = useCallback((e: SyntheticEvent) => {
    e.preventDefault();
    if (parkingPlannerState?.selectedFlight?.id) {
      setIsFormDisabled(true);
      deleteFlight({
        handleDone: (r) => {
          dispatch({ type: SELECTED_FLIGHT_UPDATE });
          clearFormData();
          setRequestUUID(uuidv4())
        },
        handleFail: (r) => {
          setErrors(r);
        },
        handleFinally: () => {
          setIsFormDisabled(false);
        },
        route: `flights/${parkingPlannerState.selectedFlight.id}`,
      });
    }
  }, [dispatch, parkingPlannerState?.selectedFlight?.id, setRequestUUID]);

  const handleClear = useCallback(() => {
    dispatch({ type: SELECTED_FLIGHT_UPDATE });
    clearFormData();
  }, [dispatch])

  const formButtons = useMemo(() => {
    if (parkingPlannerState?.selectedFlight) {
      return (
        <div className='form-buttons'>
          <input type="button" value="Clear" disabled={isFormDisabled} onClick={handleClear} />
          <input type="submit" value="Update" disabled={isFormDisabled} />
          <input type="button" value="Delete" disabled={isFormDisabled} onClick={handleDelete} />
        </div>
      );
    };
    return (<div className='form-buttons'><input type="submit" value="Submit" disabled={isFormDisabled} /></div>);
  }, [handleClear, handleDelete, isFormDisabled, parkingPlannerState?.selectedFlight]);

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
      {formButtons}
      {errors &&
        <p>{errors}</p>
      }
    </form>
  );
}
export default React.memo(ParkingScheduler);
