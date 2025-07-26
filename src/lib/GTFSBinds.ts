import type * as GTFS from "./GTFSTypes";
import { HST_UTC_OFFSET } from "./util";

const day = 24 * 60 * 60;

export const getExpectedTripFromBC = (block: GTFS.BlockContainer | undefined, tripId: string | undefined, adherence: number): GTFS.PolishedBlockTrip | undefined => {
  if(!block || !tripId) return undefined;
  const time = (Math.floor(Date.now() / 1000) - HST_UTC_OFFSET) % day + (adherence * 60);

  const thisTrip = block.trips.find(t => t.trips.includes(tripId));
  if (!thisTrip) return undefined;
  const containingTrip = block.trips.find(t => (t.firstArrives <= time && time <= t.lastDeparts) ||
    (t.firstArrives <= (time + day) && (time + day) <= t.lastDeparts));
  if (containingTrip) return containingTrip;

  // what if bus is on layover during 12:00?
  const delta = (((block.trips[block.trips.length - 1]?.firstArrives ?? 0) > day) && ((block.trips[0]?.firstArrives ?? 0) > time)) ? day : 0;
  const a = block.trips.reduce((p, c) => {
    const pTime = (time + delta) - p.firstArrives;
    const cTime = (time + delta) - c.firstArrives;
    return cTime > 0 && cTime < pTime ? c : p;
  });
  return a;
};

export const getNextTripLayover = (block?: GTFS.BlockContainer, trip?: GTFS.PolishedBlockTrip): { start: number; end: number; next?: GTFS.PolishedBlockTrip; } | undefined => {
  if(!block || !trip) return undefined;
  const nextTrip = block.trips.find((_, i) => block.trips.findIndex(t2 => trip.trips.every(t3 => t2.trips.includes(t3))) + 1 === i);
  if(!nextTrip) return { start: trip.firstArrives, end: trip.lastDeparts };
  return { start: trip.firstArrives, end: trip.lastDeparts, next: nextTrip };
}