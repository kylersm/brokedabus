import axios from "axios";
import zip from "jszip";
import * as Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";
import type * as Types from "~/lib/types";
import type * as GTFS from "~/lib/GTFSTypes";
import { BUSAPI } from "~/server/api/routers/hea";
import { getBlockInfo, YYYYMMDDToTime } from "~/server/api/routers/gtfs";
import { env } from "~/env";

interface Vehicle {
  number: string;
  trip: string;
  driver: string;
  latitude: string;
  longitude: string;
  adherence: string;
  last_message: string;
  route_short_name: string;
  headsign: string;
}

interface VehiclesContainer {
  vehicles: {
      timestamp: string;
      errorMessage?: string;
      vehicle: Vehicle[];
  }
}

const vehicles: Record<string, Types.PolishedVehicle> = {};
let fetchingVehicles = false;
let lastFetchedVehicles = -1;

const XML = new XMLParser({
  parseTagValue: false
});

const toPolishedVehicle = (v: Vehicle): Types.HEAVehicle => ({
  number: v.number,
  trip: v.trip === "null_trip" ? undefined : v.trip,
  driver: parseInt(v.driver),
  lat: parseFloat(v.latitude),
  lon: parseFloat(v.longitude),
  adherence: parseInt(v.adherence),
  last_message: new Date(v.last_message)
});

/**
 * A "turnstile" way of a relatively intense task.
 * 
 * Gets a list of vehicles from HEA api, and converts trip IDs for each vehicle to a block, and assigns it to that vehicle.
 * 
 * If it has been less than 7.5s since this function was last called, cached data is returned, otherwise it is refreshed.
 * 
 * Block info is only updated if the trip changes and is NOT found on the cached block.
 * 
 * Adherence is set to the average of the previous adherence and the current adherence. 
 * - Will be inaccurate if function isn't called over a long period of time.
 * 
 * @returns A vehicle object. Key: number, Value: vehicle
 */
export async function fetchVehicles() {
  if(fetchingVehicles) return vehicles;
  fetchingVehicles = true;
  const now = Date.now();
  if (lastFetchedVehicles < 0 || now - lastFetchedVehicles > 7.5 * 1000) {

    const xml = (await axios.get(`${BUSAPI}vehicle/?key=${env.HEA_KEY}`)).data as string;
    const newVehicles = (XML.parse(xml) as VehiclesContainer).vehicles.vehicle.map(toPolishedVehicle).filter((v, i, a) => 
      // discard if there is a vehicle with the same number without a route assigned to it
      // select one with higher index
      !a.some((d, j) => j !== i && d.number === v.number && (j > i ? d.trip !== undefined : v.trip === undefined))
    ).sort((a, b) => 
      // sort by latest message
      b.last_message.getTime() - a.last_message.getTime()
    );

    for(const nv of newVehicles) {
      const v = vehicles[nv.number];
      const block = v?.block?.trips.some(t => t.trips.includes(nv.trip ?? '')) ? v.block : nv.trip ? getBlockInfo(GTFS_FEED, nv.trip) : undefined;
      const adherence = // set adherence to whatever comes in, if not previously specified.
        (!v || isNaN(v.adherence) || lastFetchedVehicles < 0) ? nv.adherence 
        // otherwise, set it to the avg of the two
        : ((v.adherence + nv.adherence) / 2)
      vehicles[nv.number] = {
        ...nv, 
        block,
        adherence
      };
    }
    lastFetchedVehicles = now;
  }
  fetchingVehicles = false;
  return vehicles;
}

const GTFS_FEED_URL   = "https://www.thebus.org/transitdata/production/google_transit.zip";
const GTFS_KEYS: (keyof typeof GTFS_FEED)[] = ["agency", "calendar", "calendar_dates", "feed_info", "routes", "shapes", "stop_times", "stops", "trips"];

let    GTFS_LAST_MOD = 0;
export interface GTFSFeed {
  agency: GTFS.Agency[];
  calendar: GTFS.Calendar[];
  calendar_dates: GTFS.CalendarDates[];
  feed_info: GTFS.FeedInfo[];
  routes: GTFS.Route[];
  shapes: GTFS.Shape[];
  stop_times: GTFS.StopTimes[];
  stops: GTFS.Stop[];
  trips: GTFS.Trip[];
}
const GTFS_FEED: GTFSFeed = {
  agency: [],
  calendar: [],
  calendar_dates: [],
  feed_info: [],
  routes: [],
  shapes: [],
  stop_times: [],
  stops: [],
  trips: []
};
let fetchingGTFS = false;
let lastFetchedGTFS = -1;

export async function getGTFS() {
  if (fetchingGTFS) return GTFS_FEED;
  fetchingGTFS = true;
  const now = Date.now();
  if (lastFetchedGTFS < 0 || (GTFS_FEED.feed_info[0] && YYYYMMDDToTime(GTFS_FEED.feed_info[0].feed_end_date, true) <= now)) {
    const feedReq = (await axios.get<Buffer>(GTFS_FEED_URL, { responseType: "arraybuffer" }));
    const head = Date.parse(feedReq.headers["last-modified"] as string);

    // check if we need to recheck it
    if(head <= GTFS_LAST_MOD) {
      fetchingGTFS = false;
      return GTFS_FEED;
    }
    GTFS_LAST_MOD = head;

    const feedZip = await zip.loadAsync(Buffer.from(feedReq.data));
    for (const key of GTFS_KEYS) {
      const info = await feedZip.file(key + ".txt")?.async("string");
      if(!info) {
        console.error("Could not find filename " + key + ".txt in GTFS feed?!");
        continue;
      }
      (GTFS_FEED[key] as unknown[]) = Papa.parse<unknown>(info, { header: true, skipEmptyLines: true }).data;
    }

    console.log("GTFS feed received at", new Date());
    lastFetchedGTFS = now;
  }

  fetchingGTFS = false;
  return GTFS_FEED;
}