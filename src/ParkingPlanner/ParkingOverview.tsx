import * as React from "react";
import { Flight, ParkingArea } from "../API/parkingPlanningAPI";
import { get } from "../API/util";

interface P {}

export default function ParkingOverview(props: P) {
  const [flights, setFlights] = React.useState<Flight[]>();
  const [parkingareas, setParkingAreas] = React.useState<ParkingArea[]>();

  React.useEffect(() => {
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
  );
}
