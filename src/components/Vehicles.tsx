import { busInfoToShortString, filterVehicles, getVehicleInformation, type HeadsignColor, type VehicleInfo, type WindowColor, type WindowType } from "~/lib/BusTypes";
import Spinner from "./Spinner";
import { HSTify } from "~/lib/util";
import Link from "next/link";
import RouteChip from "./Route";
import type { TripVehicle } from "~/lib/types";

export enum FilterType {
  ALL='A',
  UNKNOWN='U'
};

export enum SortType {
  NUMBER='N',
  DATE='D',
  ROUTE='R'
};

export enum ActiveType {
  ALL='A',
  MONTH='M',
  WEEK='W',
  DAY='D'
};

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

  const filteredVehicles = filterVehicles(vehicles, filters);

  return filteredVehicles ? filteredVehicles.length ? <div className="m-3 px-5 grid gap-x-10 grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] w-full text-left mx-auto">
      {filteredVehicles
        .map(v => <>
          <VehicleEntryFullInfo key={'F' + v.number} vehicle={v}/>
          <VehicleEntryPhoneInfo key={'S' + v.number} vehicle={v}/>
        </>)}
      </div> : 
    <div><i>No vehicles found</i></div> :
  <Spinner/>;
};

function VehicleEntryPhoneInfo(props: {vehicle: TripVehicle }) {
  const { vehicle: v } = props;
  return <div className="mb-5 w-fit block md:hidden">
    <Link href={{
      pathname: "/vehicle/[vehicle]",
      query: { vehicle: v.number }
    }} className="font-bold text-lg inline text-blue-500 underline">BUS {v.number}</Link><br/>

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
  return <div className="mb-5 hidden md:block">
    <Link href={{
      pathname: "/vehicle/[vehicle]",
      query: { vehicle: vehicle.number }
    }} className="font-bold text-lg inline text-blue-500 underline whitespace-nowrap overflow-hidden">BUS {vehicle.number}</Link>

    <i className="text-md ml-5 whitespace-nowrap overflow-hidden">{busInfoToShortString(getVehicleInformation(vehicle.number))}<br/></i>

    <span className="font-semibold">{vehicle.tripInfo ? <><RouteChip inline route={{ code: vehicle.tripInfo.routeCode, id: vehicle.tripInfo.routeId }}/> {vehicle.tripInfo.headsign}</> : <i>No Route Assigned</i>}<br/></span>
    {vehicle.tripInfo?.trips ? <>Trip #{vehicle.tripInfo.trips.join(', ')}</> : <i>No Trip</i>}, {vehicle.driver !== 0 ? <>Driver #{vehicle.driver}</> : <i>Unknown Driver</i>}<br/>
    Updated {HSTify(vehicle.last_message)}
  </div>
}