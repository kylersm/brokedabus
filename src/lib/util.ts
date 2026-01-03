export const undefOrString = (str: string, match = "null") => {
    return str === match ? undefined : str;
}

export const isUndefinedOrMatches = <T>(o1?:T, o2?: T) => {
  return o1 === undefined || o1 === o2;
}

export const getHSTTime = () => {
  const date = new Date();
  date.setUTCHours(date.getUTCHours() - 10);
  return date.getUTCHours() * 60 * 60 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
}

const timeOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit', minute:'2-digit',
};

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric', month: 'numeric', day: 'numeric'
};

// in SECONDS
export const HST_UTC_OFFSET = 10 * 60 * 60;

export const HSTify = (date: Date, excludeDate?: boolean, excludeTime?: boolean) => {
  let showDateOnly = false;
  // i supply some date objects with no actual date; just the time, messes up the arrival.
  if (excludeDate && date.getTime() > 7 * 24 * 60 * 60 * 1000) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (date.getTime() < now.getTime())
      showDateOnly = true;
  }
  return date.toLocaleString("en-US", { 
    timeZone: "HST",
    ...(showDateOnly ? {} : timeOptions),
    ...(excludeDate && !showDateOnly ? {} : dateOptions),
    ...(excludeTime || showDateOnly ? {} : timeOptions)
  });
}

// Decodes the &amp; in "WAIKIKI HOTELS &amp; BEACHES"
export const htmlDecode = (input: string) => {
  return new DOMParser().parseFromString(input, "text/html").documentElement.textContent!;
}

const numericSorter = new Intl.Collator("en-US", { numeric: true, sensitivity: "base" });
export const sortString = (a: string, b: string) => {
  return numericSorter.compare(a, b);
}

// override how routes are ordered.
// the order is meant to group them by 'areas'.
const routeAliases: Record<string, string> = {
  "": "W LINE",  // blank for skyline
  "46": "419",
  "47": "42.0",  // put above the kapilina route

  "80":   "234", // Hawaii Kai
  "81":   "444", // Waipahu
  "82":   "234", // Kalama Valley
  "83":   "529", // Wahiawa-Haleiwa
  "84":   "509", // Mililani
  "84A":  "509", // Mililani
  "85":   "651", // Kaneohe
  "86":   "651", // Haiku
  "87":   "69", // Kailua
  "88":   "651", // Ahuimanu
  "88A":  "651", // North Shore
  "89":   "69", // Waimanalo
  "90":   "552", // Pearl City
  "91":   "429", // Ewa Beach
  "91A":  "429", // Ewa Gentry
  "92":   "419", // Makakilo
  "93":   "409", // Waianae-Makaha
  "94":   "419", // Kapolei
  "95":   "419", // Kapolei
  "96":   "444", // Waipio Gentry
  "96A":  "444", // Waikele
  "97":   "444", // Village Park
  "98":   "509", // Mililani-Wahiawa
  "98A":  "509", // Mililani
  "99":   "419", // Wahiawa-Mililani-Waipahu-Kapolei

  "PH1":  "40Z",
  "PH2":  "50Z",
  "PH3":  "52Z",
  "PH4":  "65Z",
  "PH6":  "23Z",
  "PH7":  "42Z",
  "PH8":  "33Z",

  "W1":   "42Z",
  "W2":   "44Z",
  "W3":   "200",
};

// whether it is a city/countryexpress route (reserved for one-letters?)
const isCE = (str: string) => str.length === 1 && isNaN(parseInt(str));
const isLine = (str: string) => str.endsWith(" LINE");
export const sortRouteCodes = (a: string, b: string) => {
  // decided to sort the express/lines alphabetically, since A/20 are getting dropped...
  const _a = routeAliases[parseInt(a.slice(0,2)) ? a.slice(0,2) : a];
  const _b = routeAliases[parseInt(b.slice(0,2)) ? b.slice(0,2) : b];
  a = _a ? (_a + a) : a;
  b = _b ? (_b + b) : b;
  const A = isCE(a) || isLine(a);
  const B = isCE(b) || isLine(b);
  if(A && B) return numericSorter.compare(a, b);
  else if(A) return -1;
  else if(B) return 1;

  const C = parseInt(a) <= 20;
  const D = parseInt(b) <= 20;
  if(C && D) return numericSorter.compare(a, b);
  else if (C) return -1;
  else if (D) return 1;
  if(numericSorter.compare(a.slice(0,2), b.slice(0,2)) === 0)
    return numericSorter.compare(a.slice(2) ?? '', b.slice(2) ?? '');

  return numericSorter.compare(a.slice(0,2), b.slice(0,2));
};

// 30xxx used for "garages" aka end of shifts?
// 20xxx idk
// 10xxx rail stations, not like we have the infrastructure to even have 999 rail stations
export const isRailStation = (stop: unknown): boolean => {
  if(typeof stop !== "string") return false;
  const num = parseInt(stop);
  return 10000 <= num && num < 20000;
}

// https://stackoverflow.com/a/3561711
export const escapeRegex = (input: string): string => {
  return input.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

// diameter of earth in meters
const R_Meter = 6_378_137;
// function used to calculate distance on a ROUND globe between two lat/lng points.
// returns a number in meters
export const haversine = (pt1: [number, number], pt2: [number, number]) => {
  const ALAT = pt1[0] * Math.PI / 180, ALON = pt1[1] * Math.PI / 180,
        BLAT = pt2[0] * Math.PI / 180, BLON = pt2[1] * Math.PI / 180;
  
  return 2 * R_Meter * Math.asin(Math.sqrt(Math.sin((BLAT - ALAT)/2)**2 +
         Math.cos(ALAT) * Math.cos(BLAT) *
         Math.sin((BLON - ALON)/2)**2));
}

// Member of ‘Hea Router
export type Estimated = "Scheduled" | "GPS" | "No GPS";
export type Canceled = "Expected" | "Canceled" | "Uncanceled";

export const switchEstimated = (est: number): Estimated => {
  // why is "2" a valid response??
  // docs say
  // 1: estimated
  // 0: scheduled (No GPS)
  if(est > 1)
    return "Scheduled";
  if(est === 1)
    return "GPS";
  else
    return "No GPS";
}

export const switchCanceled = (can: number): Canceled => {
  if(can > 0)
    return "Canceled";
  if(can === 0)
    return "Expected";
  else
    return "Uncanceled";
}

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const toNiceDateString = (date: Date): string => {
  //const date = new Date(millis);
  return `${months[date.getUTCMonth() % 12]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export const getHNLSafeDateString = (date: Date): string => {
  return `${('0' + (date.getUTCMonth() + 1)).slice(-2)}.${('0' + date.getUTCDate()).slice(-2)}.${date.getUTCFullYear().toString().slice(-2)}`;
}

export const dateFromHNLString = (str: string): number => {
  const split = str.split(".");
  if(split.length !== 3) return -1;
  const date = new Date(0);
  // good luck to the person that has to maintain this in 2100
  date.setUTCFullYear(2000 + parseInt(split[2]!), parseInt(split[0]!) - 1, parseInt(split[1]!));
  return date.getTime();
}

export const compareToNow = (date: string): number => {
  const dateB = dateFromHNLString(date);
  const dateA = Date.now() - HST_UTC_OFFSET * 1000;
  return Math.floor((dateA - dateB) / (1000 * 60 * 60 * 24));
}

// GTFS ignores the "24 hours in a day" and allows for times like 24:25:00 to exist
export const timeFromHNLString = (date: string): number => {
  const times = date.split(":");
  if (times.length !== 3) return 0;

  return (parseInt(times[0]!) * 60 * 60) +  // hrs
    (parseInt(times[1]!) * 60) +  // min
    parseInt(times[2]!);        // sec
}

// it is implied that the time in b and a are on the same date, even if b is bigger than 24 hours flat.
// flipped around to work better with adherence
// a is milliseconds, b is HH:MM:SS
export const compareTimes = (a: number, b: string): number => {
  const timeB = timeFromHNLString(b);
  return timeB - a;
}

export const arrivalString = (time: Date, arrives: boolean, includeTime?: boolean): string => {
  const now = Date.now();
  const ts = time.getTime();
  const withoutSeconds = Math.round((ts - now) / (60 * 1000)) * 60;
  if (withoutSeconds < 0)
    return `${arrives ? 'Arrived' : 'Departed'} ${quantifyTime(-withoutSeconds)} ago`;
  else if (withoutSeconds == 0)
    return `${arrives ? 'Arrives' : 'Departs'} now`;
  else
    return `${arrives ? 'Arrives' : 'Departs'} in ${quantifyTime(withoutSeconds)}${includeTime ? ` at ${HSTify(time, true)}` : ''}`;
}

export const quantifyTime = (time: number): string => {
  time = Math.round(time);
  const seconds = time % 60;
  const minutes = Math.floor((time / 60) % 60);
  const hours   = Math.floor((time / 60 / 60) % 24);
  const days    = Math.floor((time / 60 / 60 / 24));
  
  const base: string[] = [];
  if(days > 0) base.push(`${days} day${days != 1 ? 's' : ''}`);
  if(hours > 0) base.push(`${hours} hour${hours != 1 ? 's' : ''}`);
  if(minutes > 0) base.push(`${minutes} minute${minutes != 1 ? 's' : ''}`);
  if(seconds > 0) base.push(`${seconds} second${seconds != 1 ? 's' : ''}`);
  return base.length ? base.map((s, i) => s + (i === base.length - 2 ? ' and ' : i === base.length - 1 ? '' : ', ')).join("") : '';
}

export const quantifyTimeShortened = (time: number): string => {
  time = Math.round(time);
  const seconds = time % 60;
  const minutes = Math.floor((time / 60) % 60);
  const hours   = Math.floor((time / 60 / 60) % 24);
  const days    = Math.floor((time / 60 / 60 / 24));
  
  const base: string[] = [];
  if(days > 0) base.push(`${days}d`);
  if(hours > 0) base.push(`${hours} hr`);
  if(minutes > 0) base.push(`${minutes} min`);
  if(seconds > 0) base.push(`${seconds}s`);
  return base.join(" ");
}

export const quantifyTimeAsTS = (time: number): string => {
  time = Math.round(time);
  const seconds = time % 60;
  const minutes = Math.floor((time / 60) % 60);
  const hours   = Math.floor((time / 60 / 60) % 24);
  const days    = Math.floor((time / 60 / 60 / 24));
  
  const base: string[] = [];
  if(days > 0) base.push(days.toString().padStart(2, '0'));
  if(hours > 0) base.push(hours.toString().padStart(2, '0'));
  base.push(minutes.toString().padStart(2, '0'));
  base.push(seconds.toString().padStart(2, '0'));
  return base.join(":");
}

const plural = (number: number, pluralSuffix='s', singular=''): string => {
  return number !== 1 ? pluralSuffix : singular;
}

export const quantifyMeters = (meters: number): string => {
  // const feet  = Math.floor((miles * 5280) % 3);
  const fMeters  = Math.floor(meters % 1000);
  const kilometers = Math.floor(meters / 1000);

  const base: string[] = [];
  if(kilometers > 0) base.push(`${kilometers} kilometer${plural(kilometers)}`);
  if(fMeters > 0) base.push(`${fMeters} meter${plural(fMeters)}`);
  return base.length ? base.map((s, i) => s + (i === base.length - 2 ? ' and ' : i === base.length - 1 ? '' : ', ')).join("") : '';
}

export const quantifyMiles = (miles: number): string => {
  // const feet  = Math.floor((miles * 5280) % 3);

  const yards = miles * 1760;
  const feet = miles * 1760 * 3;

  if(miles >= 1) {
    return `${miles.toFixed(2)} mile${plural(miles)}`;
  } else if(feet > 1000) {
    return `${yards.toFixed(2)} yard${plural(yards)}`
  } else {
    return `${feet.toFixed(2)} ${plural(feet, "feet", "foot")}`;
  }
}

export const sortByContext = <T>(previous: number, current: string, i: number, array: T[]) => {
  return previous + (i % 2 === 1 ? 0 : +(i % 4 === 0 ? /[A-Za-z0-9]$/ : /^[A-Za-z0-9]/).test(current))/array.length;
}

export const areArraysSimilar = <T>(a: T[], b?:T[]) => b && a.every(item => b.includes(item));