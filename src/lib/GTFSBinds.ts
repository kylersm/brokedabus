import type * as GTFS from "./GTFSTypes";
import type { PostRqVehicle, PolishedVehicle } from "./types";
import { areArraysSimilar, getHSTTime, haversine } from "./util";

export const createPostRqVehicle = (heaVehicle: PolishedVehicle): PostRqVehicle => ({ ...heaVehicle, tripInfo: getExpectedTrip(heaVehicle.block) });
export const createPostRqVehicles = (heaVehicles: PolishedVehicle[]): PostRqVehicle[] => heaVehicles.map(v => ({ ...v, tripInfo: getExpectedTrip(v.block) }));

export const day = 24 * 60 * 60;
export const getVehicleNow = (vehicle?: PostRqVehicle, now = getHSTTime()) => {
  const vehicleNow = (now + (vehicle?.adherence ?? 0) * 60) % day;
  if((vehicleNow + 50 * 60) < (vehicle?.tripInfo?.firstArrives ?? 0) )
    return vehicleNow + day;
  else return vehicleNow;
}

export const getExpectedStop = (stops?: GTFS.StopTrip[], trip?: GTFS.PolishedBlockTrip, vehicleNow?: number): GTFS.StopTrip | undefined => {
  if(!stops?.length || !trip || typeof vehicleNow !== "number") return undefined;
  return stops.reduce((best, stop) => stop.trip.arrives > vehicleNow && (best.trip.arrives < vehicleNow || stop.trip.arrives < best.trip.arrives) ? stop : best);
}

export const getExpectedTrip = (block: GTFS.BlockContainer | undefined): GTFS.PolishedBlockTrip | undefined =>
  block?.trips.find(t => t.active);

export const getNextTripLayover = (block?: GTFS.BlockContainer, trip?: GTFS.PolishedBlockTrip): { start: number; end: number; next?: GTFS.PolishedBlockTrip; } | undefined => {
  if(!block || !trip) return undefined;
  const nextTrip = block.trips.find((_, i) => block.trips.findIndex(t => areArraysSimilar(trip.trips, t.trips)) + 1 === i);
  if(!nextTrip) return { start: trip.firstArrives, end: trip.lastDeparts };
  return { start: trip.firstArrives, end: trip.lastDeparts, next: nextTrip };
};

export const closestPoint = (shapes: GTFS.PolishedShape[], point: [number, number]): GTFS.PolishedShape => {
  const closestAfter = shapes.reduce((b, curr, i) => {
    const best = shapes[b]!;
    const havBest = haversine([best.lat, best.lon], point);
    const havCurr = haversine([curr.lat, curr.lon], point);
    return havCurr < havBest ? i : b;
  }, 0);
  return shapes[Math.min(closestAfter, shapes.length - 1)]!;
};

// internal
export const calculateDistance = (shapes: GTFS.PolishedShape[]): number => {
  return shapes.reduce((dist, curr, index) => index < 1 ? 0 : (dist + haversine([curr.lat, curr.lon], [shapes[index - 1]!.lat, shapes[index - 1]!.lon])),
    0);
};