import axios from "axios";
import zip from "jszip";
import * as Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";
import type * as Types from "~/lib/types";
import type * as GTFS from "~/lib/GTFSTypes";
import { type ArrivalsContainer, BUSAPI } from "~/server/api/routers/hea";
import { getBlockInfo, YYYYMMDDToTime } from "~/server/api/routers/gtfs";
import { env } from "~/env";
import { HST_UTC_OFFSET } from "~/lib/util";
import { day } from "~/lib/GTFSBinds";

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
let vehiclePromise: Promise<typeof vehicles> | undefined = undefined;
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
  last_message: getHSTDateFromVehicleMSG(v.last_message)
});

const getHSTDateFromVehicleMSG = (lastMsg: string) => {
  try {
    const string = lastMsg.split(' ');
    const date = string[0]!.split("/");
    const time = string[1]!.split(":");
    const isNoon = string[2] === "PM";

    const year = date[2]!;
    const month = date[0]!.padStart(2, '0');;
    const day = date[1]!.padStart(2, '0');;

    let hourVal = parseInt(time[0]!);
    if(isNoon && hourVal < 12) hourVal += 12;
    const hour = hourVal.toString().padStart(2, '0');
    const min = time[1]!.padStart(2, '0');;
    const sec = time[2]!.padStart(2, '0');;

    return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}.000-10:00`);

  } catch {
    return new Date(0);
  }
}

const setExpectedTrip = (trips: GTFS.PolishedBlockTrip[], adherence: number): void => {
  trips.forEach(t => t.active = false);
  const time = (Math.floor(Date.now() / 1000) - HST_UTC_OFFSET) % day + (adherence * 60);
  const timePlusDay = time + day;
  const containingTrip = trips.find(t => (t.firstArrives <= time && time <= t.lastDeparts) ||
    (t.firstArrives <= timePlusDay && timePlusDay <= t.lastDeparts));
  if (containingTrip)
    containingTrip.active = true;
  else {
    let timeToUse = time;
    const firstTrip = trips[0];

    // if the time 50 minutes ago is still earlier than the first trip, we are currently past a day for the block
    if((time + 50 * 60) < (firstTrip?.firstArrives ?? 0)) {
      timeToUse = timePlusDay;
    }

    const a = trips.reduce((p, c) => {
      const pTime = (timeToUse) - p.firstArrives;
      const cTime = (timeToUse) - c.firstArrives;
      return cTime > 0 && cTime < pTime ? c : p;
    });
    a.active = true;
  }
}

async function getRoute83VehiclesLat() {
  const kamHwyStops = [
    '2206', // weed circle        - checks for busses going to haleiwa
    '2341', // turtle bay resort  - checks for both directions
    '2386'  // queen liliuokalani - checks for busses going to AMC
    // all should support route 52, 60, and 88A which go above lat 21.6
  ];

  for(const stop of kamHwyStops) {
    const arrivals = (await axios.get<ArrivalsContainer>(`${BUSAPI}arrivalsJSON/?key=${env.HEA_KEY}&stop=${stop}`)).data.arrivals;
    for(const arrival of arrivals) {
      const vehicleRef = vehicles[arrival.vehicle];
      if(vehicleRef) {
        vehicleRef.lat = parseFloat(arrival.latitude);
        vehicleRef.lon = parseFloat(arrival.longitude);
      }
    }
  }
}

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
  if(lastFetchedVehicles < 0) {
    if(vehiclePromise)
      return await vehiclePromise;
    else
      return await (vehiclePromise = getVehiclePromise());
  } else
    
  if(fetchingVehicles) return vehicles;
  fetchingVehicles = true;
  const v = await getVehiclePromise();
  fetchingVehicles = false;
  return v;
}

async function getVehiclePromise() {
  const now = Date.now();
  const feed = await getGTFS();
  if (lastFetchedVehicles < 0 || now - lastFetchedVehicles > 7.5 * 1000) {
    console.log("fetching vehicles");
    const xml = (await axios.get(`${BUSAPI}vehicle/?key=${env.HEA_KEY}`)).data as string;
    const newVehicles = (XML.parse(xml) as VehiclesContainer).vehicles.vehicle.map(toPolishedVehicle).filter((v, i, a) => 
      // discard if there is a vehicle with the same number without a route assigned to it
      // select one with higher index
      !a.some((d, j) => j !== i && d.number === v.number && (j > i ? d.trip !== undefined : v.trip === undefined))
    ).sort((a, b) => 
      // sort by latest message
      b.last_message.getTime() - a.last_message.getTime()
    );

    newVehicles.forEach(nv => {
      const v = vehicles[nv.number];
      const block = !nv?.trip || feed.agency.length === 0 ? undefined :
      // determine if the current trip ID belongs to the cached block, then continue using the cached block
       v?.block?.trips.some(t => t.trips.includes(nv.trip ?? '')) ? v.block : 
      // otherwise get a new block from the new trip ID, or undefined if there is no trip
        nv.trip ? getBlockInfo(feed, nv.trip) : undefined;
      const adherence = // set adherence to whatever comes in, if not previously specified.
        (!v || isNaN(v.adherence) || lastFetchedVehicles < 0) ? nv.adherence 
        // otherwise, set it to the avg of the two
        : ((v.adherence + nv.adherence) / 2);

      if(block)
        setExpectedTrip(block?.trips, adherence);

      vehicles[nv.number] = {
        ...nv, 
        block,
        adherence
      };
    });

    await getRoute83VehiclesLat();
    lastFetchedVehicles = now;
  }

  return vehicles;
}

const GTFS_FEED_URL   = "https://www.thebus.org/transitdata/production/google_transit.zip";
const GTFS_KEYS: (keyof typeof GTFS_FEED)[] = ["agency", "calendar", "calendar_dates", "feed_info", "routes", "shapes", "stop_times", "stops", "trips"];

let    GTFS_LAST_MOD = 0;
interface StopTimeForBlock {
  start?: string;
  stop?: string;
  minSeq?: number;
  maxSeq?: number;
}
export interface GTFSFeed {
  agency: GTFS.Agency[];
  calendar: GTFS.Calendar[];
  calendar_dates: GTFS.CalendarDates[];
  feed_info: GTFS.FeedInfo[];
  routes: GTFS.Route[];
  shapes: GTFS.Shape[];
  stop_times: GTFS.StopTimes[];
  // used in getBlockInfo
  beg_end_stop_times: Record<string, StopTimeForBlock>;
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
  beg_end_stop_times: {},
  stops: [],
  trips: []
};
let fetchingGTFS = false;
let gtfsPromise: Promise<GTFSFeed> | undefined = undefined;
let lastFetchedGTFS = -1;

export async function getGTFS() {
  if(lastFetchedGTFS < 0) {
    if(gtfsPromise)
      return await gtfsPromise;
    else
      return await (gtfsPromise = getGTFSPromise());
  } else
    
  if(fetchingGTFS) return GTFS_FEED;
  fetchingGTFS = true;
  const g = await getGTFSPromise();
  fetchingGTFS = false;
  return g;
}

async function getGTFSPromise() {
  const now = Date.now();
  if (lastFetchedGTFS < 0 || (GTFS_FEED.feed_info[0] && (YYYYMMDDToTime(GTFS_FEED.feed_info[0].feed_end_date, true) + 10 * 60 * 60 * 1000) <= now)) {
    const feedReq = (await axios.get<Buffer>(GTFS_FEED_URL, { responseType: "arraybuffer" }));
    const head = Date.parse(feedReq.headers["last-modified"] as string);

    // check if we need to recheck it
    if(head <= GTFS_LAST_MOD) {
      fetchingGTFS = false;
      lastFetchedGTFS = now;
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

    // go through whole array to build indices of start and end points
    for(const st of GTFS_FEED.stop_times) {
      const sequences = parseInt(st.stop_sequence);
      // get existing entry or make a new one if it doesn't exist
      let entry: StopTimeForBlock | undefined = GTFS_FEED.beg_end_stop_times[st.trip_id];
      if(!entry)
        entry = GTFS_FEED.beg_end_stop_times[st.trip_id] = { 
          start: st.arrival_time, 
          stop: st.departure_time, 
          minSeq: sequences,
          maxSeq: sequences 
        };
      // find the first and last sequences, then assign appropriate times
      if(sequences < (entry.minSeq ?? 2)) {
        entry.start = st.arrival_time;
        entry.minSeq = sequences;
      } if(sequences > (entry.maxSeq ?? 0)) {
        entry.stop = st.departure_time;
        entry.maxSeq = sequences;
      }
    }
    console.log("GTFS feed received at", new Date());
    lastFetchedGTFS = now;
  }

  return GTFS_FEED;
}