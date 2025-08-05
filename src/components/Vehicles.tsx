import { busInfoToShortString, filterVehicles, getVehicleInformation, type HeadsignColor, type VehicleInfo, type WindowColor, type WindowType } from "~/lib/BusTypes";
import Spinner from "./Spinner";
import { HSTify, quantifyTimeShortened } from "~/lib/util";
import Link from "next/link";
import RouteChip from "./Route";
import type { TripVehicle } from "~/lib/types";
import { useState } from "react";

export enum FilterType {
  ALL='A',
  UNKNOWN='U'
};

export enum SortType {
  NUMBER='N',
  DATE='D',
  ROUTE='R',
  ADHERENCE='A'
};

export enum ActiveType {
  ALL='A',
  MONTH='M',
  WEEK='W',
  DAY='D'
};

enum View {
  ITEMS,
  LIST
}

export interface VehicleFiltering {
  lastMessage: ActiveType;
  sortType: SortType;
  ascendSort: boolean;

  hasRoute: boolean;
  hasDriver: boolean;
  includeUnknown: boolean;

  makeModel?: (keyof typeof VehicleInfo)[];
  windowType?: WindowType[];
  windowColor?: WindowColor[];
  headsignColor?: HeadsignColor[];
  leftHeadsign?: boolean;

  routeIdFilters?: string[];
}

export const defaultVehicleFilters = {
  lastMessage: ActiveType.DAY,
  sortType: SortType.DATE,
  ascendSort: false,

  hasRoute: true,
  hasDriver: true,
  includeUnknown: false
};

/**
 * Shows a grid of vehicles.
 * 
 * TEMPLATE:
 *   BUS [Vehicle] [Make model]
 *   [Route Chip] - [Headsign]
 *   Trip [#], Driver [#]
 *   Updated [Time]
 * @param props - A list of vehicles, and filtering to use
 * @returns - A react element.
 */
export default function Vehicles(props: { 
  vehicles?: TripVehicle[];
  filters: VehicleFiltering;
}) {
  const { vehicles, filters } = props;

  const [view, setView] = useState<View>(View.ITEMS);
  const filteredVehicles = filterVehicles(vehicles, filters);

  return <div>
    <div className="flex w-fit gap-x-2 mx-auto">
      <label><input type="radio" name="view" className="mr-1" checked={view === View.ITEMS} onClick={() => setView(View.ITEMS)}/>Items</label>
      <label><input type="radio" name="view" className="mr-1" checked={view === View.LIST} onClick={() => setView(View.LIST)}/>List</label>
    </div>
    {filteredVehicles ? 
    filteredVehicles.length ? 
      <div className="m-3 px-5 grid gap-x-10 grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] w-full text-left mx-auto">
        {view === View.ITEMS ? filteredVehicles.map(v => <>
          <VehicleEntryFullInfo key={'F' + v.number} vehicle={v}/>
          <VehicleEntryPhoneInfo key={'S' + v.number} vehicle={v}/>
        </>) : <table>
          <thead>
            <tr>
              <th>Bus Number</th>
              <th>Driver</th>
              <th>Adherence</th>
              <th>Last Updated</th>
              <th colSpan={2}>Route</th>
            </tr>
          </thead>
          <tbody className="[&_td]:border-2">
            {filteredVehicles.map(v => <VehicleListEntry key={'L' + v.number} vehicle={v}/>)}
          </tbody>
        </table>}
      </div> : 
    <div><i>No vehicles found</i></div> :
  <Spinner/>}
  </div>;
};

function VehicleEntryPhoneInfo(props: {vehicle: TripVehicle }) {
  const { vehicle: v } = props;
  return <div className="mb-5 w-fit block md:hidden">
    <Link href={{
      pathname: "/vehicle/[vehicle]",
      query: { vehicle: v.number }
    }} className="font-bold text-lg inline link">BUS {v.number}</Link><br/>

    <span className="font-semibold">
      {v.tripInfo ? <><RouteChip inline route={{ code: v.tripInfo.routeCode, id: v.tripInfo.routeId }}/> {v.tripInfo.headsign}</> : <i>No Route Assigned</i>}<br/>
    </span>

    Updated {v.last_message.toLocaleString("en-US", {
      timeZone: "HST", 
      hour: 'numeric', minute: 'numeric'
    })}
  </div>;
}

function VehicleEntryFullInfo(props: { vehicle: TripVehicle }) {
  const { vehicle } = props;
  const schedule = (Math.abs(vehicle.adherence) <= 0.02 ? "On" : 
    quantifyTimeShortened(Math.abs(vehicle.adherence * 60)) + ' ' +
  (vehicle.adherence > 0 ? "ahead of" : "behind")) + " schedule";
  return <div className="mb-5 hidden md:block">
    <Link href={{
      pathname: "/vehicle/[vehicle]",
      query: { vehicle: vehicle.number }
    }} className="font-bold text-lg inline whitespace-nowrap overflow-hidden link">BUS {vehicle.number}</Link>

    <i className="text-md ml-5 whitespace-nowrap overflow-hidden">{busInfoToShortString(getVehicleInformation(vehicle.number))}<br/></i>

    <span className="font-semibold">{vehicle.tripInfo ? <><RouteChip inline route={{ code: vehicle.tripInfo.routeCode, id: vehicle.tripInfo.routeId }}/> {vehicle.tripInfo.headsign}</> : <i>No Route Assigned</i>}<br/></span>
    {vehicle.tripInfo?.trips ? <>Trip #{vehicle.tripInfo.trips.join(', ')}</> : <i>No Trip</i>}, {vehicle.driver !== 0 ? <>Driver #{vehicle.driver}</> : <i>Unknown Driver</i>}<br/>
    {schedule}<br/>
    Updated {HSTify(vehicle.last_message)}
  </div>
}

function VehicleListEntry(props: { vehicle: TripVehicle }) {
  const { vehicle } = props;
  const { tripInfo } = vehicle;

  const schedule = (Math.abs(vehicle.adherence) <= 0.02 ? "On" : 
    quantifyTimeShortened(Math.abs(vehicle.adherence * 60)) + ' ' +
  (vehicle.adherence > 0 ? "ahead of" : "behind")) + " schedule";
  return <tr>
    <td className="text-xl font-semibold text-right">{vehicle.number}</td>
    <td>{vehicle.driver}</td>
    <td>{schedule}</td>
    <td>{HSTify(vehicle.last_message)}</td>
    {tripInfo ? <>
      <td className="border-r-0"><RouteChip route={{ code: tripInfo.routeCode, id: tripInfo.routeId}}/></td>
      <td>{tripInfo.headsign}</td>
    </> : null}
  </tr>;
}