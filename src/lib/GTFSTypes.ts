import type * as Types from "~/lib/types";

export interface Agency {
  agency_id: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang: string;
  agency_fare_url: string;
}

export interface CalendarDates {
  service_id: string;
  date: string;
  exception_type: string;
}

export interface Calendar {
  service_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  start_date: string;
  end_date: string;
  events_and_status: string;
  operating_days: string;
  duty: string;
}

export interface FeedInfo {
  feed_publisher_name: string;
	feed_publisher_url: string;
	feed_lang: string;
	feed_start_date: string;
	feed_end_date: string;
	feed_version: string;
	feed_description: string;
}

export interface Route {
  route_id: string;
	route_short_name: string;
	route_long_name: string;
	route_desc: string;
	route_type: string;
	agency_id: string;
	route_color: string;
	route_text_color: string;
}

export interface PolishedRoute {
  _id: string;
  code: string;
  name: string;
  type: string;
  agencyId: string;
  color: string;
  textColor: string;
};

export const makePolishedRoute = (r: Route): PolishedRoute => ({
  _id: r.route_id,
  code: r.route_short_name,
  name: r.route_long_name,
  type: r.route_type,
  agencyId: r.agency_id,
  color: r.route_color,
  textColor: r.route_text_color
});

export interface Shape {
  shape_id: string;
	shape_pt_lat: string;
	shape_pt_lon: string;
	shape_pt_sequence: string;
}

export interface PolishedShape {
  _id: string;
  lat: number;
  lon: number;
  sequence: number;
}

export interface PolishedShapeContainer {
  shapeId: string;
  direction: number;
  shapes: PolishedShape[];
  length: number;
}

export const makePolishedShape = (s: Shape): PolishedShape => ({
  _id: s.shape_id,
  lat: parseFloat(s.shape_pt_lat),
  lon: parseFloat(s.shape_pt_lon),
  sequence: parseInt(s.shape_pt_sequence)
});

export interface StopTimes {
  trip_id: string;
	arrival_time: string;
	departure_time: string;
	stop_id: string;
	stop_sequence: string;
	stop_headsign: string;
	pickup_type: string;
	drop_off_type: string;
	shape_dist_traveled: string;
	timepoint: string;
	stop_code: string;
}

export const makePolishedStopTime = (st: StopTimes) => ({
  trip: st.trip_id,
  arrives: st.arrival_time,
  departs: st.departure_time,
  stopId: st.stop_id,
  stopCode: st.stop_code,
  sequence: st.stop_sequence,
  distanceTraveled: parseFloat(st.shape_dist_traveled)
});

export interface Stop {
  stop_id: string;
	stop_code: string;
	stop_name: string;
	stop_desc: string;
	stop_lat: string;
	stop_lon: string;
	zone_id: string;
	stop_url: string;
	location_type: string;
	parent_station: string;
	stop_serial_number: string;
}

export const makePolishedStop = (s: Stop) => ({
  _id: s.stop_id,
  code: s.stop_code,
  name: s.stop_name,
  lat: parseFloat(s.stop_lat),
  lon: parseFloat(s.stop_lon),
  url: s.stop_url,
  serial: s.stop_serial_number
});

export interface Trip {
  route_id: string;
	service_id: string;
	trip_id: string;
	trip_headsign: string;
	direction_id: string;
	block_id: string;
	shape_id: string;
	trip_headsign_short: string;
	apc_trip_id: string;
	display_code: string;
	trip_serial_number: string;
	block: string;
}

interface TimeTrip {
  _id: string;
  arrives: number;
  departs: number;
  sequence: number;
};

export interface StopTrip {
  stop: Types.PolishedStop;
  trip: TimeTrip;
};

export interface TripInfos {
  stop: Types.PolishedStop;
  trips: TimeTrip[];
};

export interface ShapeStops {
  shapes: string[]; // by shape id
  stops: string[];  // by stop code
}

export interface BlockContainer {
  _id: string;
  name: string;
  trips: PolishedBlockTrip[];
}

export interface PolishedBlockTrip extends Types.IdentifiableTrip {
  firstArrives: number;
  lastDeparts: number;
}
export interface UnifiedCalendarInfo {
  trips: Types.IdentifiableTrip[];
  time: number;
}
export interface CalendarInfoMini {
  trips: Types.SuperficialTrip[];
}
export interface CalendarInfo {
  trip: Types.SuperficialTrip;
  times: number[];
}

export interface ShapesWithStops {
  shapes: PolishedShapeContainer[];
  stops: (Types.PolishedStop & { shapes: string[]; })[];
}
