import { type Canceled, type Estimated } from "~/lib/util";
import type { BlockContainer, PolishedBlockTrip, PolishedRoute } from "./GTFSTypes";

export interface Vehicle {
  number: string;
  driver?: number;
  lat: number;
  lon: number;
  adherence: number;
  last_message: Date;
}

export interface HEAVehicle extends Vehicle {
  trip?: string;
}

export interface TripVehicle extends Vehicle {
  tripInfo?: PolishedBlockTrip;
}

export interface PolishedVehicle extends HEAVehicle {
  block?: BlockContainer;
}

export type PostRqVehicle = TripVehicle & PolishedVehicle;

export interface HEA_Arrival {
  id: string;
  trip: string;
  route: string;
  headsign: string;
  direction: string;
  vehicle: string;
  estimated: string;

  stopTime: string;
  date: string;

  longitude: string;
  latitude: string;
  shape: string;
  canceled: string;
}

export interface PolishedArrival {
  id: string;
  trip: IdentifiableTrip;
  distance: number;

  stopTime: Date;
  departing: boolean;
  estimated: Estimated;
  status: Canceled;
}

export interface PolishedArrivalsContainer {
  vehicle?: PostRqVehicle;
  arrivals: PolishedArrival[];
}

export interface PolishedArrivalContainer {
  vehicle?: PostRqVehicle;
  arrival?: PolishedArrival;
}

export interface Stop {
  stop_id: string;
  stop_lon: number;
  stop_lat: number;
  stop_name: string;
  stop_code: string;
}

export interface StopContainer {
  stops: Stop[];
}

export interface PolishedStop {
  _id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export interface Route {
  routeNum: string;
  shapeID: string;
  firstStop: string;
  headsign: string;
}

export interface RouteContainer {
  routeName: string;
  routeID: string;
  route: Route[];
  errorMessage?: string;
}

export interface PolishedHEARoute {
  shapeID: string;
  headsign: string;
  firstStopCode: string;
  firstStopName: string;
  direction: number;
}

export interface PolishedRouteContainerBase {
  routeCode: string;
  routeID: string;
}

// used when listing all different headsigns/routings of a specific route
export interface PolishedRoutesContainer extends PolishedRouteContainerBase {
  routes: PolishedHEARoute[];
  gtfsInfo: PolishedRoute;
}

// used when listing different routes of one headsign
export interface PolishedRouteContainer extends PolishedRouteContainerBase {
  route: PolishedHEARoute;
}

export interface PolishedPartialRoutesContainer extends PolishedRouteContainerBase {
  routes: {
    headsign: string;
    direction: number;
  }[];
  gtfsInfo: PolishedRoute;
}

export interface Trip {
  route_short_name: string;   // 13
  trip_headsign: string;      // "WAIKIKI - UH Manoa",
  route_id: string;           // "127"
}

export interface TripContainer {
  trips: Trip[];
}

export interface SuperficialTrip {
  routeId: string;
  routeCode: string;
  headsign: string;
  // used for identifying (usually based on route and headsign)
  displayCode: string;
}

export interface TripWithShape extends SuperficialTrip {
  shapeId: string;
}

export interface IdentifiableTrip extends TripWithShape {
  // TheBus GTFS does a weird thing where some trips are split up into two subtrips, 
  // e.g. same headsign, same direction, same shape, but one trip may serve the first half of stops, 
  // and the second trip may serve the following half of stops.
  trips: string[];
  direction: number;
}

export interface TripStopAIO {
  trips: SuperficialTrip[];
  info: PolishedStop;
}

// Shape 

export interface Shape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled: null;
}

export interface ShapeContainer {
  shapes: Shape[];
}

// Calendar

export interface Calendar {
  scheduled_date: string;
  is_special: string;
}

export interface CalendarContainer {
  mainList: Calendar[];
}

export interface PolishedCalendar {
  date: Date;
  special: boolean;
}

// Time table

export interface ScheduleEntry {
  shape_id: string;
  service_id: string;
  stop_id: string;
  arrival_time: string;
  route_short_name: string;
  trip_headsign: string;
  route_id: string;
  arrival_time_12: string;
  arrival_time_bar: string;
}

export interface ScheduleContainer {
  trips: ScheduleEntry[];
}

export interface PolishedSchedule {
  shapeId: string;
  serviceId: string;
  arrives: Date;
  timebar: string;
}