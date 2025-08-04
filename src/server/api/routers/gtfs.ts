import * as GTFS from "~/lib/GTFSTypes";
import type * as Types from "~/lib/types";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { haversine, HST_UTC_OFFSET, switchCanceled, switchEstimated, timeFromHNLString } from "~/lib/util";
import { type SuperficialRoute } from "~/components/Route";
import { decode } from "html-entities";
import { TRPCError } from "@trpc/server";
import { type ShapesWithStops, type UnifiedCalendarInfo } from "~/lib/GTFSTypes";
import { getGTFS, type GTFSFeed } from "~/utils/cache";

const getShape = (feed: GTFSFeed, shapeID: string): GTFS.PolishedShape[] => {
  const shapes = feed.shapes.filter(s => s.shape_id === shapeID);
  return shapes.map(GTFS.makePolishedShape).sort((a, b) => a.sequence - b.sequence);
}

const getDirectionFromShID = (feed: GTFSFeed, shid: string): number => {
  const trip = feed.trips.find(t => t.shape_id === shid);
  const result = trip?.direction_id;
  return result === undefined ? -1 : parseInt(result);
}

const getShapeByShID = (feed: GTFSFeed, shid: string): GTFS.PolishedShapeContainer | undefined => {
  const filteredShapes = getShape(feed, shid).sort((a, b) => a.sequence - b.sequence);
  if (!filteredShapes.length) return undefined;

  return {
    shapeId: shid,
    direction: getDirectionFromShID(feed, shid),
    shapes: filteredShapes,
    length: calculateDistance(filteredShapes)
  };
};

const getGTFSActivePeriod = (feed: GTFSFeed) => {
  const FI = feed.feed_info[0];

  if(!FI) return undefined;
  
  const start = YYYYMMDDToTime(FI.feed_start_date);
  const end = YYYYMMDDToTime(FI.feed_end_date, true);
  return { start, end };
}

const getShapeByTripID = (feed: GTFSFeed, trip: string): GTFS.PolishedShapeContainer | undefined => {
  const shid = getShIDByTripID(feed, trip);
  if(shid === undefined) return undefined;
  return getShapeByShID(feed, shid);
}

const isStopStartingPoint = (feed: GTFSFeed, stop: string, trip: string): boolean => {
  const t = feed.stop_times.find(st => st.trip_id === trip && st.stop_code === stop)?.stop_sequence === "1";
  return t;
};

const getStopByCode = (feed: GTFSFeed, stopCode: string): Types.PolishedStop | undefined => {
  const stop = feed.stops.find(s => s.stop_code === stopCode);
  return stop ? GTFS.makePolishedStop(stop) : undefined;
};

const getWeekArray = (c: GTFS.Calendar) => [c.sunday, c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday];

const getStopHeadsignsForDate = (feed: GTFSFeed, stop: string, date=new Date(Date.now() - HST_UTC_OFFSET * 1000)): Types.SuperficialTrip[] => {
  const stopTrips = feed.stop_times.filter(st => st.stop_code === stop).map(st => st.trip_id);
  const exceptions = feed.calendar_dates.filter(c => c.date === getYYYYMMDD(date.getTime()));
  const routines = feed.calendar
    .filter(c => 
      YYYYMMDDToTime(c.start_date) <= date.getTime() && date.getTime() < YYYYMMDDToTime(c.end_date, true) &&
      getWeekArray(c)[date.getUTCDay()] === "1")
    .map(c => c.service_id)
    .filter(s => !exceptions.some(e => e.service_id === s && e.exception_type === "2"))
    .concat(exceptions.filter(e => e.exception_type === "1").map(e => e.service_id));

  const trips = feed.trips.filter(t => 
    routines.includes(t.service_id) &&
    stopTrips.includes(t.trip_id)
  )
  const routes = feed.routes.filter(r => trips.map(t => t.route_id).includes(r.route_id));
  const headsignTrip: Types.SuperficialTrip[] = [];
  for(const trip of trips) {
    if(headsignTrip.some(ht => ht.displayCode === trip.display_code)) continue;
    const routeCode = routes.find(r => r.route_id === trip.route_id)?.route_short_name;
    if(routeCode === undefined) continue;
    headsignTrip.push({
      routeId: trip.route_id,
      routeCode: routeCode,
      headsign: trip.trip_headsign,
      displayCode: trip.display_code,
      // direction: parseInt(trip.direction_id) ?? -1
    })
  }

  return headsignTrip;
}

const getStopHeadsigns = (feed: GTFSFeed, stop: string): Types.SuperficialTrip[] => {
  const stopTimes = feed.stop_times.filter(st => st.stop_code === stop);
  const trips = feed.trips.filter(t => stopTimes.map(st => st.trip_id).includes(t.trip_id));
  const routes = feed.routes.filter(r => trips.map(t => t.route_id).includes(r.route_id));
  
  const headsignTrip: Types.SuperficialTrip[] = [];
  for(const trip of trips) {
    if(headsignTrip.some(ht => ht.displayCode === trip.display_code)) continue;
    const routeCode = routes.find(r => r.route_id === trip.route_id)?.route_short_name;
    if(routeCode === undefined) continue;
    headsignTrip.push({
      routeId: trip.route_id,
      routeCode: routeCode,
      headsign: trip.trip_headsign,
      displayCode: trip.display_code,
      // direction: parseInt(trip.direction_id) ?? -1
    })
  }

  return headsignTrip;
}

const getStopWithHeadsigns = (feed: GTFSFeed, code: string, date?: Date): Types.TripStopAIO | undefined => {
  const info = getStopByCode(feed, code);
  if(!info) return undefined;
  const trips = getStopHeadsignsForDate(feed, code, date);
  return {
    info, trips
  };
}

const getStopsByShID = (feed: GTFSFeed, shid: string): Types.PolishedStop[] => {
  const trips = feed.trips.filter(t => t.shape_id === shid);
  const stopTimes = feed.stop_times.filter(st => trips.map(t => t.trip_id).includes(st.trip_id));
  const stops = feed.stops.filter(s => stopTimes.map(st => st.stop_id).includes(s.stop_id));

  return stops.map(GTFS.makePolishedStop);
}

const getTrip = (feed: GTFSFeed, tripID?: string): Types.IdentifiableTrip | undefined => {
  if(!tripID) return undefined;

  const trip = feed.trips.find(t => t.trip_id === tripID);
  if(!trip) return undefined;

  const route = feed.routes.find(r => r.route_id === trip.route_id);
  if(!route) return undefined;

  return {
    trips: [trip.trip_id],
    headsign: trip.trip_headsign,
    routeId: trip.route_id,
    routeCode: route.route_short_name,
    shapeId: trip.shape_id,
    direction: parseInt(trip.direction_id) ?? -1,
    displayCode: trip.display_code
  };
}

const getShIDByTripID = (feed: GTFSFeed, tripID: string): string | undefined => {
  return feed.trips.find(t => t.trip_id === tripID)?.shape_id;
}

const getRouteInfoByCode = (feed: GTFSFeed, routeCode: string): GTFS.PolishedRoute | undefined => {
  const route = feed.routes.find(r => r.route_short_name === routeCode);
  return route ? GTFS.makePolishedRoute(route) : undefined;
}

// internal
const getRouteInfoByID = (feed: GTFSFeed, routeId: string): GTFS.PolishedRoute | undefined => {
  const route = feed.routes.find(r => r.route_id === routeId);
  return route ? GTFS.makePolishedRoute(route) : undefined;
}

export const getYYYYMMDD = (time: number): string => {
  const date = new Date(time);

  return date.getUTCFullYear() +
         (date.getUTCMonth() + 1).toString().padStart(2, '0') +
         date.getUTCDate().toString().padStart(2, '0');
}

export const YYYYMMDDToTime = (time: string, byMidnight?: boolean): number => {
  const date = new Date();
  date.setUTCFullYear(
    parseInt(time.slice(0, 4)),     // Year
    parseInt(time.slice(4, 6)) - 1, // Month
    parseInt(time.slice(6, 8))      // Day
  );
  date.setUTCHours((byMidnight ? 24 : 0), 0, 0, 0);
  return date.getTime();
} 

// internal
const getRouteHeadsigns = (feed: GTFSFeed, routeId: string): Types.PolishedHEARoute[] | undefined => {
  const trips = feed.trips.filter(t => t.route_id === routeId)
    .filter((t, i, a) => a.findIndex(t2 => t.trip_headsign === t2.trip_headsign && t.shape_id === t2.shape_id) === i);

  const firstStops = feed.stop_times.filter(st => trips.map(t => t.trip_id).includes(st.trip_id) && st.stop_sequence === "1");
  const routes: Types.PolishedHEARoute[] = [];
  for(const trip of trips) {
    const st = firstStops.find(st => st.trip_id === trip.trip_id);
    if(!st) continue;

    const s = feed.stops.find(s => s.stop_id === st.stop_id);
    if(!s) continue;

    routes.push({
      shapeID: trip.shape_id,
      headsign: trip.trip_headsign,
      firstStopName: s.stop_name,
      firstStopCode: s.stop_code,
      direction: parseInt(trip.direction_id) ?? -1
    });
  }

  return routes;
}

const getRouteWithShapesByID = (feed: GTFSFeed, routeId: string): Types.PolishedRoutesContainer | undefined => {
  const route = getRouteInfoByID(feed, routeId);
  if(!route) return undefined;
  const headsigns = getRouteHeadsigns(feed, route._id);
  if(!headsigns) return undefined;

  return {
    routeCode: route.code,
    routeID: route._id,
    routes: headsigns,
    gtfsInfo: route
  };
}

// internal
const closestPoint = (shapes: GTFS.PolishedShape[], point: [number, number]): GTFS.PolishedShape => {
  return shapes.reduce((best, curr) => {
    const havBest = haversine([best.lat, best.lon], point);
    const havCurr = haversine([curr.lat, curr.lon], point);
    return havCurr < havBest ? curr : best;
  });
};

// internal
const calculateDistance = (shapes: GTFS.PolishedShape[]): number => {
  return shapes.reduce((dist, curr, index) => 
    index < 1 ? 0 : (dist + haversine([curr.lat, curr.lon], [shapes[index-1]!.lat, shapes[index-1]!.lon])),
  0);
}

const getDistWithFutureTripToPoint = (
  feed: GTFSFeed, 
  location: [number, number],
  destination: [number, number],
  currentShape: string | undefined,
  futureShape: string,
) => {
  let currentTripToEnd = 0;
  if (currentShape !== undefined && currentShape !== futureShape)
    currentTripToEnd = getDistToEnd(feed, location, currentShape);

  return currentTripToEnd + getDistToNearestShapeToPoint(feed, location, destination, futureShape);
}

// internal
const getDistToEnd = (
  feed: GTFSFeed, 
  location: [number, number], 
  shid: string
): number => {
  const shape = getShape(feed, shid);

  if (!shape.length) return -1;

  const closestLoc = closestPoint(shape, location);

  return haversine([closestLoc.lat, closestLoc.lon], location) +
         calculateDistance(shape.filter(s => closestLoc.sequence <= s.sequence));
}

const getDistToNearestShapeToPoint = (
  feed: GTFSFeed, 
  location: [number, number], 
  target: [number, number], 
  shid: string
): number => {
  const shape = getShape(feed, shid);
  if (!shape.length) return haversine(location, target);

  const closestLoc = closestPoint(shape, location);
  const closestTar = closestPoint(shape, target);

  return haversine([closestLoc.lat, closestLoc.lon], location) +
         haversine([closestTar.lat, closestTar.lon], target) +
         calculateDistance(shape.filter(
          s => Math.min(closestLoc.sequence, closestTar.sequence) <= s.sequence &&
               s.sequence <= Math.max(closestLoc.sequence, closestTar.sequence) 
         ));
};

export const toPolishedArrival = (feed: GTFSFeed, stop: string, arrival: Types.HEA_Arrival, vehicle?: Types.TripVehicle): Types.PolishedArrival => {
  // needs to be
  const departing = isStopStartingPoint(feed, stop, arrival.trip);
  const stopInfo = getStopByCode(feed, stop);
  const tripVehicle: Types.TripVehicle | undefined = vehicle;
  const date = arrival.date.split('/').map(x => parseInt(x));
  const isNoon = arrival.stopTime.endsWith("PM");
  const time = arrival.stopTime.slice(0, -3).split(":").map(x => parseInt(x));
  if(isNoon) {
    if(time[0] !== 12)
      time[0]! += 12;
  } else {
    if(time[0] === 12)
      time[0] -= 12;
  }

  const stopTime = new Date(`${date[2]!}-${('0' + date[0]).slice(-2)}-${('0' + date[1]).slice(-2)}T${('0' + time[0]).slice(-2)}:${('0' + time[1]).slice(-2)}:00.000-10:00`);
  const arrivalTrip = getTrip(feed, arrival.trip) ?? {
    direction: 0,
    displayCode: '',
    headsign: decode(arrival.headsign, { level: "xml" }),
    routeCode: arrival.route,
    routeId: '',
    shapeId: arrival.shape,
    trips: [arrival.trip]
  };

  return {
    trip: arrivalTrip,
    departing,
    distance: stopInfo && tripVehicle ? 
      getDistWithFutureTripToPoint(feed, [tripVehicle.lat, tripVehicle.lon], [stopInfo.lat, stopInfo.lon], tripVehicle.tripInfo?.shapeId, arrivalTrip.shapeId) : 0,
    estimated: switchEstimated(parseInt(arrival.estimated)),
    status: switchCanceled(parseInt(arrival.canceled)),
    id: arrival.id,
    stopTime
  };
};

/* const getTrip = (feed: GTFSFeed, tripId: string): GTFS.PolishedBlockTrip | undefined => {
  const trip = feed.trips.find(t => t.trip_id === tripId);
  if(!trip) return undefined;
  const route = feed.routes.find(r => r.route_id === trip.route_id);
  if(!route) return undefined;
  return {
      trips: [trip.trip_id],
      shapeId: trip.shape_id,
      displayCode: trip.display_code,

      routeCode: route.route_short_name,
      direction: parseInt(trip.direction_id) ?? -1,
      headsign: trip.trip_headsign,
      routeId: route.route_id,

      firstArrives: 0, 
      lastDeparts: 0
    };
} */

export const getBlockInfo = (feed: GTFSFeed, tripId: string): GTFS.BlockContainer | undefined => {
  const trip = feed.trips.find(t => t.trip_id === tripId);
  if(!trip?.block_id) return undefined;

  const blockTrips = feed.trips.filter(t => t.block_id === trip.block_id && t.service_id === trip.service_id);

  const routes = feed.routes.filter(r => blockTrips.map(t => t.route_id).includes(r.route_id));

  let ranking: GTFS.PolishedBlockTrip[] = [];
  for(const trip of blockTrips) {
    const tripSt = feed.beg_end_stop_times[trip.trip_id];
    if(!tripSt?.start || !tripSt.stop) continue;
    const route = routes.find(r => r.route_id === trip.route_id);
    if(!route) continue;

    const firstArrives = timeFromHNLString(tripSt.start);
    const lastDeparts = timeFromHNLString(tripSt.stop);

    const current: GTFS.PolishedBlockTrip = {
      trips: [trip.trip_id],
      shapeId: trip.shape_id,
      displayCode: trip.display_code,

      routeCode: route.route_short_name,
      direction: parseInt(trip.direction_id) ?? -1,
      headsign: trip.trip_headsign,
      routeId: route.route_id,

      firstArrives, 
      lastDeparts
    };
    
    ranking.push(current);
  }

  ranking = ranking.sort((a, b) => a.firstArrives - b.lastDeparts);
  // check for and merge any trips that were broken up into two
  for (let i = 1; i < ranking.length; i++) {
    const previous = ranking[i - 1];
    const current = ranking[i];
    if(previous && current && 
      previous.headsign === current.headsign &&
      previous.shapeId === current.shapeId &&
      previous.direction === current.direction &&
      previous.displayCode === current.displayCode &&
      previous.lastDeparts === current.firstArrives
    ) {
      previous.lastDeparts = current.lastDeparts;
      previous.trips.push(...current.trips);
      ranking.splice(i, 1);
      i--;
    }
  }

  return {
    _id: trip.block_id,
    name: trip.block,
    trips: ranking
  };
}

const zLocation = z.tuple([ z.number(), z.number() ]);

export const GTFSRouter = createTRPCRouter({
  getShapeByShID: publicProcedure
    .input(z.object({ shid: z.string() }))
    .query(async ({ input }): Promise<GTFS.PolishedShapeContainer> => {
      const feed = await getGTFS();
      const shape = getShapeByShID(feed, input.shid);
      if (!shape) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Shape not found"
      });
      return shape;
    }),
  getShapeByShIDs: publicProcedure
    .input(z.object({ shids: z.array(z.string()) }))
    .query(async ({ input }): Promise<GTFS.PolishedShapeContainer[]> => {
      const feed = await getGTFS();
      const shapes = [];
      for(const shid of [...new Set(input.shids)]) {
        const shape = getShapeByShID(feed, shid);
        if(!shape) continue;
        else shapes.push(shape);
      }
      return shapes;
    }),
  getShapesByTripIDs: publicProcedure
    .input(z.object({ tripIds: z.array(z.string()) }))
    .query(async ({ input }): Promise<GTFS.PolishedShapeContainer[]> => {
      const feed = await getGTFS();
      const shapes = [];
      for(const trip of [...new Set(input.tripIds)]) {
        const shape = getShapeByTripID(feed, trip);
        if(!shape) continue;
        else shapes.push(shape);
      }
      return shapes;
    }),
  getShapesByRoute: publicProcedure
    .input(z.object({ routeId: z.string() }))
    .query(async ({ input }): Promise<GTFS.PolishedShapeContainer[]> => {
      const feed = await getGTFS();
      const shids = [...new Set(feed.trips.filter(t => t.route_id === input.routeId).map(t => t.shape_id))];
      const shapes: GTFS.PolishedShapeContainer[] = [];
      for(const shid of [...new Set(shids)]) {
        const shape = getShapeByShID(feed, shid);
        if(!shape) continue;
        shapes.push(shape);
      }
      return shapes;
    }),
  getStopsByCodes: publicProcedure
    .input(z.object({  stopCodes: z.array(z.string()) }))
    .query(async ({ input }): Promise<Types.TripStopAIO[]> => {
      const feed = await getGTFS();
      const stopIds = [...new Set(input.stopCodes)];
      const stops = stopIds.map(s => getStopWithHeadsigns(feed, s));
      return stops.filter(s => s !== undefined);
    }),
  getStopsByTripID: publicProcedure
    .input(z.object({ tripId: z.string().array().max(5) }))
    .query(async ({ input }): Promise<GTFS.StopTrip[]> => {
      const feed = await getGTFS();
      const stopTimes = feed.stop_times.filter(st => input.tripId.includes(st.trip_id));
      const matchingStops = feed.stops.filter(s => stopTimes.map(st => st.stop_id).includes(s.stop_id));
      
      const tripStops: GTFS.StopTrip[] = [];
      for(const st of stopTimes) {
        const stop = matchingStops.find(stop => stop.stop_id === st.stop_id);
        if(!stop) continue;
          tripStops.push({
            stop: GTFS.makePolishedStop(stop),
            trip: {
              _id: st.trip_id,
              arrives: timeFromHNLString(st.arrival_time),
              departs: timeFromHNLString(st.departure_time),
              sequence: parseInt(st.stop_sequence),
            }
          });
      }
    
      return tripStops.sort((a, b) => a.trip.sequence - b.trip.sequence).map((s, i, a) => ({
        ...s,
        trip: {
          ...s.trip,
          arrives: s.trip.arrives + (i > 0 && a[i - 1]!.trip.arrives === s.trip.arrives ? 5 : 0)
        }
      }));
    }),
  getStopsByTripIDs: publicProcedure
    .input(z.object({ tripIds: z.array(z.string()) }))
    .query(async ({ input }): Promise<GTFS.TripInfos[]> => {
      const feed = await getGTFS();
      const stopTimes = feed.stop_times.filter(st => input.tripIds.includes(st.trip_id));
      const matchingStops = feed.stops.filter(s => stopTimes.map(st => st.stop_id).includes(s.stop_id));

      const tripStops: GTFS.TripInfos[] = [];
      for(const st of stopTimes) {
        const stop = matchingStops.find(stop => stop.stop_id === st.stop_id);
        if(!stop) continue;
        const existingTS = tripStops.find(t => t.stop._id === stop.stop_id);
        const trip = {
          _id: st.trip_id,
          arrives: timeFromHNLString(st.arrival_time),
          departs: timeFromHNLString(st.departure_time),
          sequence: parseInt(st.stop_sequence),
        };
        if(existingTS)
          existingTS.trips.push(trip);
        else
          tripStops.push({
            stop: GTFS.makePolishedStop(stop),
            trips: [trip]
          });
      }
    
      return tripStops;
    }),
  getStopsFromPointAndDistance: publicProcedure
    .input(z.object({ point: zLocation, distance: z.number() }))
    .query(async ({ input }): Promise<Types.PolishedStop[]> => {
      const feed = await getGTFS();
      const stops = feed.stops.filter(s => haversine(input.point, [parseFloat(s.stop_lat), parseFloat(s.stop_lon)]) <= input.distance);
      return stops.map(GTFS.makePolishedStop);
    }),
  getStopWithHeadsigns: publicProcedure
    .input(z.object({ code: z.string(), date: z.date().optional() }))
    .query(async ({ input }): Promise<Types.TripStopAIO> => {
      const feed = await getGTFS();
      const stop = getStopWithHeadsigns(feed, input.code, input.date);
      if (!stop) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Stop not found"
      });
      return stop;
    }),
  getStopsByStreetName: publicProcedure
    .input(z.object({ street: z.string() }))
    .query(async ({ input }): Promise<Types.TripStopAIO[]> => {
      const feed = await getGTFS();
      if (input.street.length < 2) return [];
      const stops = feed.stops.filter(s => s.stop_name.toLowerCase().includes(input.street.toLowerCase()));
      return stops.map(s => ({
        info: GTFS.makePolishedStop(s),
        trips: getStopHeadsigns(feed, s.stop_code)
      }));
    }),
  getRoutesByHeadsign: publicProcedure
    .input(z.object({ headsign: z.string() }))
    .query(async ({ input }): Promise<Types.PolishedRouteContainer[]> => {
      const feed = await getGTFS();
      const trips = feed.trips.filter((t, i, a) => 
        t.trip_headsign.toLowerCase().includes(input.headsign.toLowerCase()) &&
        a.findIndex(t2 => t2.route_id === t.route_id && t2.shape_id === t.shape_id && t2.trip_headsign === t.trip_headsign) === i
      );
      
      const firstSt = feed.stop_times.filter(st => st.stop_sequence === "1");
      const rtContainers: Types.PolishedRouteContainer[] = [];
      for(const trip of trips) {
        const r = feed.routes.find(r => r.route_id === trip.route_id);
        if(!r) continue;
        
        const st = firstSt.find(st => st.trip_id === trip.trip_id);
        if(!st) continue;
        
        if (rtContainers.some(rt => 
          rt.routeID === r.route_id &&
          rt.route.headsign === trip.trip_headsign &&
          rt.route.shapeID === trip.shape_id
        )) continue;

        const s = feed.stops.find(s => s.stop_id === st.stop_id);
        if(!s) continue;

        rtContainers.push({
          routeID: r.route_id,
          routeCode: r.route_short_name,
          route: {
            firstStopCode: s.stop_code,
            firstStopName: s.stop_name,
            headsign: trip.trip_headsign,
            shapeID: trip.shape_id,
            direction: getDirectionFromShID(feed, trip.shape_id)
          }
        });
      }

      return rtContainers;
    }),
  getRoutesByShIDs: publicProcedure
    .input(z.object({ shids: z.array(z.string()) }))
    .query(async ({ input }): Promise<Types.TripWithShape[]> => {
      const feed = await getGTFS();
      const routes = [];
      for(const shid of [...new Set(input.shids)]) {
        const trip = feed.trips.find(t => t.shape_id === shid);
        if(!trip) continue;
        const route = feed.routes.find(r => r.route_id === trip.route_id);
        if(!route) continue;
        routes.push({
          displayCode: trip.display_code,
          routeCode: route.route_short_name,
          headsign: trip.trip_headsign,
          routeId: route.route_id,
          shapeId: trip.shape_id,
        });
      }
      if(!routes.length) throw new TRPCError({
        code: "NOT_FOUND",
        message: "No routes found."
      })
      return routes;
    }),
  getShapesWithStopsByShIDs: publicProcedure
    .input(z.object({ shids: z.array(z.string()) }))
    .query(async ({ input }) => {
      if (input.shids.length > 10)
        input.shids = input.shids.slice(0, 10);

      const feed = await getGTFS();
      const obj: ShapesWithStops = {
        shapes: [],
        stops: []
      }
      
      for(const shid of [...new Set(input.shids)]) {
        const shape = getShapeByShID(feed, shid);
        if(shape) {
          const shapeStops = getStopsByShID(feed, shid);
          for(const stop of shapeStops) {
            if (!obj.stops.find(s => s._id === stop._id)?.shapes.push(shid))
              obj.stops.push({ ...stop, shapes: [shid] });
          }
          obj.shapes.push(shape);
        }
      }
      
      if(obj.shapes.length === 1)
        obj.stops = obj.stops.map(s => ({ ...s, shapes: [] }));
    
      return obj;
    }),
  getAssociatedShapeStops: publicProcedure
    .input(z.object({ tripIds: z.array(z.string()) }))
    .query(async ({ input }): Promise<GTFS.ShapeStops> => {
      const feed = await getGTFS();
      const stops = feed.stop_times.filter(st => input.tripIds.includes(st.trip_id)).map(st => st.stop_code);
      const shapes = feed.trips.filter(t => input.tripIds.includes(t.trip_id)).map(t => t.shape_id);

      return {
        shapes,
        stops
      };
    }),
  getRouteWithShapesByID: publicProcedure
    .input(z.object({ routeId: z.string() }))
    .query(async ({ input }): Promise<Types.PolishedRoutesContainer> => {
      const feed = await getGTFS();
      const routes = getRouteWithShapesByID(feed, input.routeId);
      if (!routes) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Routes not found"
      });
      return routes;
    }),
  getRouteWithShapesByCode: publicProcedure
    .input(z.object({ routeCode: z.string() }))
    .query(async ({ input }): Promise<Types.PolishedRoutesContainer> => {
      const feed = await getGTFS();
      const error = new TRPCError({
        code: "NOT_FOUND",
        message: "Routes not found",
        cause: "Could not get headsigns or route."
      });
      const route = getRouteInfoByCode(feed, input.routeCode);
      if(!route) throw error;
      const headsigns = getRouteHeadsigns(feed, route._id);
      if(!headsigns) throw error;

      return {
        routeCode: route.code,
        routeID: route._id,
        routes: headsigns,
        gtfsInfo: route
      };
    }),
  getAllRoutes: publicProcedure
    .query(async (): Promise<Types.PolishedPartialRoutesContainer[]> => {
      const feed = await getGTFS();
      const routes = feed.routes;
      const headsigns = feed.trips.filter((t, i, a) => a.findIndex(t2 => t2.display_code === t.display_code) === i);

      const routeContainers: Types.PolishedPartialRoutesContainer[] = [];
      for(const route of routes) {
        const rHeadsigns = headsigns.filter(h => h.route_id === route.route_id);
        if(!rHeadsigns.length) continue;
        routeContainers.push({
          gtfsInfo: GTFS.makePolishedRoute(route),
          routeCode: route.route_short_name,
          routeID: route.route_id,
          routes: rHeadsigns.map(h => ({
            direction: parseInt(h.direction_id) ?? -1,
            headsign: h.trip_headsign
          }))
        });
      }
    
      return routeContainers;
    }),
  getAllRouteSuperficial: publicProcedure
    .query(async (): Promise<GTFS.PolishedRoute[]> => {
      const feed = await getGTFS();
      const routes = feed.routes;
      return routes.map(GTFS.makePolishedRoute);
    }),
  getCalendarOverview: publicProcedure
    .input(z.object({ stopId: z.string() }))
    .query(async ({ input }): Promise<Record<string, SuperficialRoute[]>> => {
      const feed = await getGTFS();
      // offset by -10 hr
      const gtfsActive = getGTFSActivePeriod(feed);
      if(!gtfsActive) throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Could not get end of GTFS active period"
      });

      // get all trip IDs for the stop
      const stopTimes = feed.stop_times.filter(s => s.stop_id === input.stopId);

      // then get trips so we can access service IDs
      const trips = feed.trips.filter(t => stopTimes.map(st => st.trip_id).includes(t.trip_id));

      const serviceIds = [...new Set(trips.map(t => t.service_id))];

      // check for routine with service IDs
      const calendar = feed.calendar.filter(c => serviceIds.includes(c.service_id));

      // check for exceptions
      const calendarDates = feed.calendar_dates.filter(c => serviceIds.includes(c.service_id));
      const routes = feed.routes.filter(r => trips.map(t => t.route_id).includes(r.route_id));

      const numbers: Record<string, SuperficialRoute[]> = {};

      const now = new Date(gtfsActive.start);
      // now.setUTCHours(now.getUTCHours(), 0, 0, 0);

      for(; now.getTime() < gtfsActive.end; now.setUTCDate(now.getUTCDate() + 1)) {
        // needed to get day of week
        // routines active for the day
        const routines = calendar.filter(c => 
          // check if date lies within range
          YYYYMMDDToTime(c.start_date) <= now.getTime() && now.getTime() < YYYYMMDDToTime(c.end_date,true) &&
          // then check to see if it is active today
          getWeekArray(c)[now.getUTCDay()] === "1"
        );
        // exceptions for the day (usually empty)
        const exceptions = calendarDates.filter(c =>
          c.date === getYYYYMMDD(now.getTime())
        );
      
        const tripsForDay = trips.filter(t =>
          // map to service IDs
          routines.map(r => r.service_id)
            // get rid of service removed via exception
            .filter(s => !exceptions.some(e => e.service_id === s && e.exception_type === "2"))
            // and also add service if it was via exception
            .concat(exceptions.filter(e => e.exception_type === "1").map(e => e.service_id))
            // if the list includes the service ID
            .includes(t.service_id)
        );
      
        const dayRoutes = [];
        for(const rid of [...new Set(tripsForDay.map(t => t.route_id))]) {
          const route = routes.find(r2 => r2.route_id === rid);
          if(!route) continue;
          dayRoutes.push({ id: route.route_id, code: route.route_short_name})
        }
        numbers[now.getTime().toString()] = dayRoutes;
      }
    
      return numbers;
    }),
  getTripInfos: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input }): Promise<Record<string, GTFS.PolishedBlockTrip>> => {
      const feed = await getGTFS();
      const trips = [...new Set(input)];
      const obj: Record<string, GTFS.PolishedBlockTrip> = {};
      for(const t of trips) {
        const trip = getTrip(feed, t);
        if(!trip) continue;
        obj[t] = { ...trip, firstArrives: 0, lastDeparts: 48 * 60 * 60 };
      }
      // return trips.map(t => getTrip(feed, t)).filter((t): t is Types.IdentifiableTrip => t !== undefined);
      return obj;
    }),
  getCalendarInfo: publicProcedure
    .input(z.object({ stopId: z.string(), date: z.date() }))
    .query(async ({ input }): Promise<UnifiedCalendarInfo[]> => {
      const feed = await getGTFS();
      // get all trip IDs for the stop
      const stopTimes = feed.stop_times.filter(st => st.stop_id === input.stopId);
      const stopTrips = stopTimes.map(st => st.trip_id);
      // get all exceptions for the date
      const exceptions = feed.calendar_dates.filter(c => c.date === getYYYYMMDD(input.date.getTime()));
      // filter calendar for all routes today (faster than checking if calendar service ID matches trip)
      const routines = feed.calendar
        // first, check if date is in range and it's active for this day
        .filter(c => 
          YYYYMMDDToTime(c.start_date) <= input.date.getTime() && input.date.getTime() < YYYYMMDDToTime(c.end_date, true) &&
          getWeekArray(c)[input.date.getUTCDay()] === "1")
        .map(c => c.service_id)
        // remove service IDs who have had their service explicitly removed for the day
        .filter(s => !exceptions.some(e => e.service_id === s && e.exception_type === "2"))
        // and add service IDs who have had their service explicitly added for the day
        .concat(exceptions.filter(e => e.exception_type === "1").map(e => e.service_id));
      
      // get trips that are in the routine and the stop's trip list
      const trips = feed.trips.filter(t => 
        routines.includes(t.service_id) &&
        stopTrips.includes(t.trip_id)
      )
      // then get routes
      const routes = feed.routes.filter(r => trips.map(t => t.route_id).includes(r.route_id));
      
      const timeTable: { time: number; trips: Types.IdentifiableTrip[] }[] = [];
      for (const trip of trips) {
        const routeInfo = routes.find(r => r.route_id === trip.route_id);
        if (!routeInfo)
          continue;
        const times = stopTimes.filter(st => st.trip_id === trip.trip_id).map(st => timeFromHNLString(st.arrival_time));
        for (const time of times) {
          const obj = timeTable.find(st => st.time === time);
          const superficialTrip: Types.IdentifiableTrip = {
            trips: [trip.trip_id],
            shapeId: trip.shape_id,
            direction: parseInt(trip.direction_id) ?? -1,
          
            routeCode: routeInfo.route_short_name,
            headsign: trip.trip_headsign,
            routeId: trip.route_id,
            displayCode: trip.display_code
          };
          if (obj)
            obj.trips.push(superficialTrip);
          else
            timeTable.push({ time, trips: [superficialTrip] });
        }
      }
    
      return timeTable.sort((a, b) => a.time - b.time);
    })
});

// idea 2: make timetable for route?
/*
export const getRouteTimeTable = (routeId: string) => {
  const trips = feed.trips.filter(t => t.route_id === routeId)
  const stopTimes = feed.stop_times.filter(st => trips.map(t => t.trip_id).includes(st.trip_id));
  
  // const stops = await db.stops
  //   .where("stop_id")
  //   .anyOf(stopTimes.map(st => st.stop_id))
  //   .toArray();
  
  const numbers: Record<string, unknown[]> = {};
  // for all trips
  for (const trip of trips) {
    //const tripTimes = stopTimes.filter(st => st.trip_id === trip.trip_id).sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));
    numbers[trip.trip_id] = stopTimes.filter(st => st.trip_id === trip.trip_id).map(st => st.arrival_time)
    /*stopTimes.map(st => ({
      arrives: timeFromHNLString(st.arrival_time),
      stop: []//stops.find(s => s.stop_id === st.stop_id)
    })).filter(st => st.stop !== undefined);* /
  }
  return numbers;
}*/