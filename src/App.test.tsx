import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders parking areas and flights", async () => {
  render(<App />);
  const app = screen.getByText(/Flights/i);
  expect(app).toBeInTheDocument();
});
