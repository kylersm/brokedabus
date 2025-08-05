import axios from "axios";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type * as Types from "~/lib/types";
import * as GTFS from "./gtfs";
import * as GTFSBinds from "~/lib/GTFSBinds";
import { fetchVehicles, getGTFS } from "~/utils/cache";
import { env } from "~/env";
import { getExpectedTrip } from "~/lib/GTFSBinds";

// used to report vehicle locations and timeliness
export const BUSAPI = "https://api.thebus.org/";

interface ArrivalsContainer {
  stop: string;
  timestamp: number;
  arrivals: Types.HEA_Arrival[];
}

const getArrivals = async(stop: string): Promise<Types.PolishedArrivalsContainer[]> => {
  const feed = await getGTFS();
  const vehicles = Object.values(await fetchVehicles());
  const arrivals = (await axios.get<ArrivalsContainer>(`${BUSAPI}arrivalsJSON/?key=${env.HEA_KEY}&stop=${stop}`)).data.arrivals;

  const containerArr: Types.PolishedArrivalsContainer[] = [];

  for(const arrival of arrivals) {
    const vehicle: Types.PostRqVehicle | undefined = arrival.vehicle !== "???" ? vehicles.find(v => v.number === arrival.vehicle) : 
    /**
     * code to search vehicle for trips ourselves: 
     * vehicles.filter(v => v.block).find(v => v.block?.trips.some(t => t.trip === a.trip)) 
     */ undefined;
    if(vehicle) vehicle.tripInfo = getExpectedTrip(vehicle.block);

    const polishedArrival = GTFS.toPolishedArrival(feed, stop, arrival, vehicle);
    let foundArrival;
    if(vehicle && (foundArrival = containerArr.find(c => c.vehicle?.number === vehicle.number)))
      foundArrival.arrivals.push(polishedArrival);
    else 
      containerArr.push({
        vehicle,
        arrivals: [polishedArrival]
      });
  }

  return containerArr;

  /* return arrivals.map(a => GTFS.toPolishedArrival(feed, stop, a, a.vehicle !== "???" ? vehicles.find(v => v.number === a.vehicle || v.block?.trips.some(t => t.trips.includes(a.trip))) ?? { 
    adherence: 0,
    last_message: new Date(0),
    lat: parseFloat(a.latitude),
    lon: parseFloat(a.longitude),
    number: a.vehicle,
    trip: a.trip
  } : undefined)).filter(s => s !== undefined) */
};

const filterVehicles = (v: Types.PolishedVehicle, route?: string, lastActive?: number) => 
  // if we're filtering by route check if vehicle matches route
  (!route || GTFSBinds.getExpectedTrip(v.block)?.routeCode.toLowerCase() === route?.toLowerCase()) &&
  // if vehicle's last message was within x hours
  (typeof lastActive !== "number" || v.last_message.getTime() >= Date.now() - 1000 * 60 * 60 * lastActive);

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
      return Object.values(vehicles).filter(v => filterVehicles(v, input.route, input.lastActive));
    }
  ),

  // exclude block from response
  getVehicleTO: publicProcedure
    .input(z.object({ vehicleNum: z.string() }))
    .query(async ({ input }): Promise<Types.TripVehicle> => {
      const vehicles = await fetchVehicles();
      const { block, ...vehicle } = vehicles[input.vehicleNum] ?? {};
      if(!('number' in vehicle)) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vehicle not found"
      }); 

      return {
        ...vehicle,
        tripInfo: GTFSBinds.getExpectedTrip(block)
      };
    }
  ),

  getVehiclesTO: publicProcedure
    .input(z.object({ 
      route: z.string().optional(),
      lastActive: z.number().optional() }))
    .query(async ({ input }): Promise<Types.TripVehicle[]> => {
      const vehicles = await fetchVehicles();
      return Object.values(vehicles).filter(v => filterVehicles(v, input.route, input.lastActive))
      .map(({ block, ...v }): Types.TripVehicle => ({
        ...v,
        tripInfo: GTFSBinds.getExpectedTrip(block)
      }));
    }
  ),
  // stop should be the stop code, route should be shorthand: A instead of 22
  getArrivals: publicProcedure
    .input(z.object({ stop: z.string(), route: z.string().optional() }))
    .query(async ({ input }): Promise<Types.PolishedArrivalsContainer[]> => {
      const arrivals = await getArrivals(input.stop);
      return arrivals.filter(a => 
        input.route === undefined || 
        a.arrivals.some(ar => ar.trip.routeCode.toUpperCase() === input.route?.toUpperCase())
      ).filter((c): c is Types.PolishedArrivalsContainer => c.arrivals !== undefined);
    }
  ),

  // get arrivals for stop, only grab vehicle specified
  // either grab using stop and trip, or if gone, rely on vehicle number
  getArrivalIfExists: publicProcedure
    .input(z.object({ stop: z.string(), trip: z.string(), vehicle: z.string().optional() }))
    .query(async ({ input }): Promise<Types.PolishedArrivalContainer> => {
      const arrival = (await getArrivals(input.stop)).find(a => 
        a.arrivals.some(a => a.trip.trips.includes(input.trip)))
      if(!arrival) {
        if(input.vehicle) {
          const { block, ...vehicle } = (await fetchVehicles())[input.vehicle] ?? {};
          if(!('number' in vehicle)) throw new TRPCError({ code: "NOT_FOUND" });
          return { vehicle: { ...vehicle, tripInfo: GTFSBinds.getExpectedTrip(block) } }
        } else throw new TRPCError({ code: "NOT_FOUND" });
      }
      return {
        vehicle: arrival.vehicle,
        arrival: arrival.arrivals.find(a => a.trip.trips.includes(input.trip))
      };
    }
  )

});