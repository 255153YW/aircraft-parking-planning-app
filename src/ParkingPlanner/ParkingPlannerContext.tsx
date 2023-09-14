import React, { createContext, useReducer } from "react";
import { Flight } from "../API/parkingPlanningAPI";

export const DATA_TABLE_ROW_MAP_UPDATE = "DATA_TABLE_ROW_MAP_UPDATE";
export const DATA_TABLE_ROW_INDEX_UPDATE = "DATA_TABLE_ROW_INDEX_UPDATE";
export const SELECTED_FLIGHT_UPDATE = "SELECTED_FLIGHT_UPDATE";
export const CLEAR_SELECTED_FLIGHT = "CLEAR_SELECTED_FLIGHT";

interface ParkingPlannerStateType {
  dataTableRowFlightMap: Array<Flight|null>|null,
  selectedDataTableRowIndex: number,
  selectedFlight: Flight|null,
}

interface ParkingPlannerContextType {
  parkingPlannerState: ParkingPlannerStateType,
  dispatch: Function,
}

export const ParkingPlannerContext = createContext<ParkingPlannerContextType>({
  parkingPlannerState: { dataTableRowFlightMap: null, selectedDataTableRowIndex: -1, selectedFlight: null },
  dispatch: () => { }
});
interface ParkingPlannerActionType {
  dataTableRowFlightMapUpdate: Array<Flight | null> | null,
  dataTableRowIndexUpdate: number,
  selectedFlightUpdate: Flight|null,
  type: string,
}

const parkingPlannerReducer = (parkingPlannerState: ParkingPlannerStateType, action: ParkingPlannerActionType) => {
  switch (action.type) {
    case DATA_TABLE_ROW_MAP_UPDATE: {
      const { dataTableRowFlightMapUpdate } = action;
      return {
        ...parkingPlannerState,
        dataTableRowFlightMap: dataTableRowFlightMapUpdate,
        selectedDataTableRowIndex: -1
      };
    }
    case DATA_TABLE_ROW_INDEX_UPDATE: {
      const { dataTableRowIndexUpdate } = action;
      return {
        ...parkingPlannerState,
        selectedDataTableRowIndex: dataTableRowIndexUpdate
      };
    }
    case SELECTED_FLIGHT_UPDATE: {
      const { selectedFlightUpdate } = action;
      return {
        ...parkingPlannerState,
        selectedFlight: selectedFlightUpdate
      };
    }
    case CLEAR_SELECTED_FLIGHT: {
      return { dataTableRowFlightMap: null, selectedDataTableRowIndex: -1, selectedFlight: null }
    }
    default:
      throw new Error();
  }
};

export const ParkingPlannerProvider = (props: { children: React.ReactNode }) => {
  const [parkingPlannerState, dispatch] = useReducer(
    parkingPlannerReducer,
    {
      dataTableRowFlightMap: null,
      selectedDataTableRowIndex: -1,
      selectedFlight:null
    }
  );

  const parkingPlannerContextProps = {
    parkingPlannerState,
    dispatch
  };

  return (
    <ParkingPlannerContext.Provider value={parkingPlannerContextProps}>
      {props.children}
    </ParkingPlannerContext.Provider>
  );
};
