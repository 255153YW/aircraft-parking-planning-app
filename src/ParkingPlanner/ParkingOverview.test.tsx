/* eslint-disable testing-library/no-render-in-setup */
import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { get, post, deleteFlight, DecoratedRequest } from "../API/util";
import ParkingOverview from './ParkingOverview';

const mockGetCall = jest.fn();
const mockPostCall = jest.fn();
const mockDeleteCall = jest.fn();
jest.mock('../API/util.tsx', () => {
  const originalModule = jest.requireActual('../API/util.tsx');
  // Mock any module exports here
  return {
    __esModule: true,
    ...originalModule,
    get: (requestParam: DecoratedRequest) => mockGetCall(requestParam),
    post: (requestParam: DecoratedRequest) => mockPostCall(requestParam),
    deleteFlight: (requestParam: DecoratedRequest) => mockDeleteCall(requestParam),
  };
});

let documentBody: RenderResult;
describe('<ParkingOverview>', () => {
  beforeEach(() => {
    documentBody = render(<ParkingOverview />);
    jest.clearAllMocks();
  });
  it('should call api on start, one time for each GET route', () => {
    render(<ParkingOverview />);
    expect(mockGetCall).toHaveBeenNthCalledWith(1, expect.objectContaining({
      route: 'flights'
    }));
    expect(mockGetCall).toHaveBeenNthCalledWith(2, expect.objectContaining({
      route: 'parkingareas'
    }));
    expect(mockGetCall).toBeCalledTimes(2);
  });
});