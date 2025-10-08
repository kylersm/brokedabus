import { busInfoToShortString, filterVehicles, getVehicleInformation, type HeadsignColor, type VehicleInfo, type WindowColor, type WindowType } from "~/lib/BusTypes";
import Spinner from "./Spinner";
import { HSTify, quantifyTimeAsTS, quantifyTimeShortened } from "~/lib/util";
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
  sortType: SortType.NUMBER,
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
    <div className="flex w-fit gap-x-2 mx-auto mb-3">
      <label><input type="radio" name="view" className="mr-1" checked={view === View.ITEMS} onChange={() => setView(View.ITEMS)}/>Items</label>
      <label><input type="radio" name="view" className="mr-1" checked={view === View.LIST} onChange={() => setView(View.LIST)}/>List</label>
    </div>
    {filteredVehicles ? 
    filteredVehicles.length ? 
        view === View.ITEMS ? <div className="mb-3 px-5 grid gap-x-10 grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] w-full text-left mx-auto">{filteredVehicles.map(v => <>
          <VehicleEntryFullInfo key={'F' + v.number} vehicle={v}/>
          <VehicleEntryPhoneInfo key={'S' + v.number} vehicle={v}/>
        </>)}</div> : <table className="border-collapse w-full mx-auto sm:text-left whitespace-nowrap">
          <thead>
            <tr className="text-center">
              <th>Bus</th>
              <th className="hidden md:table-cell" colSpan={2}>Route</th><th className="table-cell md:hidden" colSpan={1}>Route</th>
              <th className="hidden lg:table-cell">Trip</th>
              <th className="hidden lg:table-cell">Driver</th>
              <th className="hidden md:table-cell">Adherence</th><th className="table-cell md:hidden">Adhr.</th>
              <th className="hidden lg:table-cell">Last Updated</th><th className="table-cell lg:hidden">Updated</th>
            </tr>
          </thead>
          <tbody className="altcolors">
            {filteredVehicles.map(v => <VehicleListEntry key={'L' + v.number} vehicle={v}/>)}
          </tbody>
        </table> : 
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

  const onSchedule = Math.abs(vehicle.adherence) <= 0.02;
  const schedule = (onSchedule ? "On" : 
    quantifyTimeShortened(Math.abs(vehicle.adherence * 60)) + ' ' +
  (vehicle.adherence > 0 ? "ahead of" : "behind")) + " schedule";
  const minifySchedule = onSchedule ? "On time": `${vehicle.adherence < 0 ? '-' : '+'}${quantifyTimeAsTS(Math.abs(vehicle.adherence * 60))}`;
  return <tr>
    <td className="text-xl font-semibold text-center font-mono py-3 sm:py-0.5 px-3">
      <Link className="link" href={{
        pathname: "/vehicle/[vehicle]",
        query: { vehicle: vehicle.number }
      }}>{vehicle.number}</Link>
    </td>
    {tripInfo ? <>
      <td><div className="flex justify-center gap-x-2">
        <RouteChip route={{ code: tripInfo.routeCode, id: tripInfo.routeId}}/>
        <span className="block sm:hidden">{tripInfo.direction ? '->' : '<-'}</span>
        <span className="hidden sm:block md:hidden font-mono">{tripInfo.direction ? 'Eastbound' : 'Westbound'}</span>
      </div></td>
      <td className="hidden md:table-cell w-fit pl-1">
        {/* Force route name to not force the table off-page & make a scrollbar: https://stackoverflow.com/a/19623352 */}
        <table className="table-fixed w-full border-0 border-collapse border-spacing-0">
          <tr className="!bg-transparent"><td className="whitespace-nowrap overflow-hidden text-ellipsis">
            {tripInfo.headsign}
          </td></tr>
        </table>
      </td>
      <td className="hidden lg:table-cell">{tripInfo.trips}</td>
    </> :  <>
      <td className="table-cell md:hidden text-center">-</td>
      <td className="hidden md:table-cell text-center" colSpan={2}>-</td>
      <td className="hidden lg:table-cell text-center">-</td>
    </>}
    <td className="hidden lg:table-cell px-2 text-center">{vehicle.driver ? vehicle.driver : <i>-</i>}</td>
    <td className={"px-2 font-mono " + (!onSchedule ? vehicle.adherence > 0 ? "text-green-500" : "text-red-500" : '')}>
      <span className="hidden md:block">{schedule}</span>
      <span className="block md:hidden text-center">{minifySchedule}</span>
    </td>
      <td className="hidden lg:table-cell px-2">{HSTify(vehicle.last_message)}</td>
      <td className="table-cell lg:hidden px-2 text-center font-mono">{HSTify(vehicle.last_message, true)}</td>
  </tr>;
}