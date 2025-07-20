import axios from "axios";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type * as Types from "~/lib/types";
import * as GTFS from "./gtfs";
import * as GTFSBinds from "~/lib/GTFSBinds";
import { fetchVehicles, getGTFS } from "~/utils/cache";
import { env } from "~/env";

// used to report vehicle locations and timeliness
export const BUSAPI = "https://api.thebus.org/";

interface ArrivalsContainer {
  stop: string;
  timestamp: number;
  arrivals: Types.HEA_Arrival[];
}

const getArrivals = async(stop: string): Promise<(Partial<Types.PolishedArrivalContainer>)[]> => {
  const feed = await getGTFS();
  const vehicles = Object.values(await fetchVehicles());
  const arrivals = (await axios.get<ArrivalsContainer>(`${BUSAPI}arrivalsJSON/?key=${env.HEA_KEY}&stop=${stop}`)).data.arrivals;
  return arrivals.map(a => GTFS.toPolishedArrival(feed, a, a.vehicle !== "???" ? vehicles.find(v => v.number === a.vehicle) ?? { 
    adherence: 0,
    last_message: new Date(0),
    lat: parseFloat(a.latitude),
    lon: parseFloat(a.longitude),
    number: a.vehicle,
    trip: a.trip
  } : /* vehicles.filter(v => v.block).find(v => v.block?.trips.some(t => t.trip === a.trip)) */ undefined, stop)).filter(s => s !== undefined)
};

export const HEARouter = createTRPCRouter({
  // use the big number on the side of the bus
  // fault with upstream API: ampersand char (&) is not encoded to &amp;
  getVehicle: publicProcedure
    .input(z.object({ vehicleNum: z.string() }))
    .query(async ({ input }): Promise<Types.PolishedVehicle> => {
      const vehicles = await fetchVehicles();
      const vehicle = vehicles[input.vehicleNum];
      if(!vehicle) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vehicle not found"
      }); 
      else return vehicle;
    }
  ),

  // filters output of getVehicles by route/headsign
  getVehicles: publicProcedure
    // lastActive measured in HOURS
    .input(z.object({ 
      route: z.string().optional(),
      lastActive: z.number().optional() }))
    .query(async ({ input }): Promise<Types.PolishedVehicle[]> => {
      const vehicles = await fetchVehicles();
      return Object.values(vehicles).filter(v =>
          // if we're filtering by route check if vehicle matches route
          (!input.route || 
            v.block?.trips.find(t => t.trips.includes(v.trip ?? ''))?.routeCode.toLowerCase() === input.route?.toLowerCase() 
            // avg. response 2.1s to 2.4s response with route 42 11:20PM
            /*|| 
            (v.block?.trips.some(t => t.routeCode.toLowerCase() === input.route?.toLowerCase()) && GTFSBinds.getNextTripLayover(v.block, GTFSBinds.getExpectedTripFromBC(v.block, v.trip, v.adherence))?.next?.routeCode.toLowerCase() === input.route.toLowerCase())
            */) &&
          // if vehicle's last message was within x hours
          (typeof input.lastActive !== "number" || v.last_message.getTime() >= Date.now() - 1000 * 60 * 60 * input.lastActive)
      );
    }
  ),

  getVehicleTO: publicProcedure
    .input(z.object({ vehicleNum: z.string() }))
    .query(async ({ input }): Promise<Types.TripVehicle> => {
      const vehicles = await fetchVehicles();
      const vehicle = vehicles[input.vehicleNum];
      if(!vehicle) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vehicle not found"
      }); 

      return vehicle.block && vehicle.trip ? {
        adherence: vehicle.adherence,
        last_message: vehicle.last_message,
        lat: vehicle.lat,
        lon: vehicle.lon,
        number: vehicle.number,
        driver: vehicle.driver,
        tripInfo: GTFSBinds.getExpectedTripFromBC(vehicle.block, vehicle.trip, vehicle.adherence)
      } : vehicle;
    }
  ),

  getVehiclesTO: publicProcedure
    .input(z.object({ 
      route: z.string().optional(),
      lastActive: z.number().optional() }))
    .query(async ({ input }): Promise<Types.TripVehicle[]> => {
      const vehicles = await fetchVehicles();
      return Object.values(vehicles).filter(v =>
          // if we're filtering by route check if vehicle matches route
          (!input.route || v.block?.trips.find(t => t.trips.includes(v.trip ?? ''))?.routeCode.toLowerCase() === input.route?.toLowerCase()) &&
          // if vehicle's last message was within x hours
          (typeof input.lastActive !== "number" || v.last_message.getTime() >= Date.now() - 1000 * 60 * 60 * input.lastActive)
      ).map((v): Types.TripVehicle => v.block && v.trip ? {
        tripInfo: GTFSBinds.getExpectedTripFromBC(v.block, v.trip, v.adherence),
        adherence: v.adherence,
        last_message: v.last_message,
        lat: v.lat,
        lon: v.lon,
        number: v.number,
        driver: v.driver,
      } : v);
    }
  ),
  // stop should be the stop code, route should be shorthand: A instead of 22
  getArrivals: publicProcedure
    .input(z.object({ stop: z.string(), route: z.string().optional() }))
    .query(async ({ input }): Promise<Types.PolishedArrivalContainer[]> => {
      const arrivals = await getArrivals(input.stop);
      return arrivals.filter(a => 
        input.route === undefined || 
        a.arrival?.trip.routeCode.toUpperCase() === input.route.toUpperCase()
      ).filter((c): c is Types.PolishedArrivalContainer => c.arrival !== undefined);
    }
  ),

  // get arrivals for stop, only grab vehicle specified
  // either grab using stop and trip, or if gone, rely on vehicle number
  getArrivalIfExists: publicProcedure
    .input(z.object({ stop: z.string(), trip: z.string(), vehicle: z.string().optional() }))
    .query(async ({ input }): Promise<Partial<Types.PolishedArrivalContainer>> => {
      const arrival = (await getArrivals(input.stop)).find(a => 
        a.arrival?.trip.trips.includes(input.trip));
      if(!arrival) {
        if(input.vehicle) {
          const vehicle = (await fetchVehicles())[input.vehicle];
          if(!vehicle) throw new TRPCError({ code: "NOT_FOUND" });
          return { vehicle: { ...vehicle, tripInfo: GTFSBinds.getExpectedTripFromBC(vehicle.block, vehicle.trip, vehicle.adherence) } }
        } else throw new TRPCError({ code: "NOT_FOUND" });
      }
      return arrival;
    }
  )

});