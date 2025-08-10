import type { SuperficialRoute } from "~/components/Route";
import { HST_UTC_OFFSET, isUndefinedOrMatches, sortRouteCodes, sortString } from "./util";
import { type TripVehicle } from "./types";
import { ActiveType, SortType, type VehicleFiltering } from "~/components/Vehicles";

/**
 * Warning
 * =======
 * 
 * This needs to be manually updated every so often because there isn't an API dedicated for this.
 * Last updated 25/04/20
 * 
 */

// route codes
export const routeTrafficTypes = {
  // #B97C2A
  urban: [
    'A',
    '1',
    '1L',
    '2',
    '2L',
    '3',
    '4',
    '8',
    '13',
    '20',
    '46'
  ],
  // #2E6CA9
  suburban: [
    'C',
    'E',
    '40',
    '42',
    '51',
    '52',
    '53',
    '54',
    '60',
    '61',
    '65',
    '66',
    '67'
  ],
  // #699F61
  local: [
    '5',   '6',   '7',   '10',  '14',  '23',
    '32',  '41',  '43',  '44',  '47',  '69',
    '102', '122', '123', '151', '200', '301',
    '303', '307', '401', '402', '403', '411',
    '414', '415', '416', '433', '444', '461',
    '501', '503', '504', '511', '512', '521',
    '531', '532', '533', '535', '541', '542',
    '544', '545', '551', '552', '651', '671',
    '672', '673', '674'
  ]
  // we probably dont need to list "express routes"
}

export const colors = {
  urban:    "#B97C2A",
  suburban: "#2E6CA9",
  local:    "#699F61",    
  commute:  "#B39EAA",
  
  rail:     "#142E57"
};

export const brightenColor = (color: string, level=0x333333): string => {
  const hex = color.split('#')[1];
  if(!hex) return "";
  return '#' + (parseInt(hex, 16) + level).toString(16).toUpperCase();
}

/**
 * @param routeCode 
 * @returns 
 */
export const getColorFromRoute = (route: SuperficialRoute): string => {
  if(route.id === "181" || route.code.toLowerCase() === "skyline")
    return colors.rail;
  else if(routeTrafficTypes.urban.includes(route.code))
    return colors.urban;
  else if(routeTrafficTypes.suburban.includes(route.code))
    return colors.suburban;
  else if(routeTrafficTypes.local.includes(route.code))
    return colors.local;
  else
    return colors.commute;
}

export const getContrastFromRoute = (route: SuperficialRoute): string => {
  if(route.id === "181" || route.code.toLowerCase() === "skyline")
    return "#fff";
  else if(routeTrafficTypes.urban.includes(route.code))
    return "#000";
  else if(routeTrafficTypes.suburban.includes(route.code))
    return "#fff"
  else if(routeTrafficTypes.local.includes(route.code))
    return "#000";
  else
    return "#000";
}

// Decomissioned vehicles aren't listed
export interface VehicleBlurb {
  manufacturer: Manufacturer;

  desc: string;
  shortDesc: string;
  length: number; // in feet
  fuelType: FuelType;

  articulated: boolean;
};

export enum WindowType {
  Frameless="Frameless",
  Individual="Individual"
};

export enum WindowColor {
  Blue="Blue",
  Black="Black"
};

export enum HeadsignColor {
  Amber="Amber",
  White="White",
  Colored="Colored"
};

export type BusInfo = {
  model: VehicleBlurb;
  year: string;

  windowColor: WindowColor;
  windowType: WindowType;

  leftHeadsign: boolean;
  headsignColor: HeadsignColor;
}

export enum Manufacturer {
  Gillig="Gillig",
  NewFlyer="New Flyer",
  Nova="Nova"
};

export enum FuelType {
  Diesel="Diesel",
  Hybrid="Hybrid",
  Electric="Electric"
};

export const VehicleInfo = {
  // Gillig Phantom (rip!)
  G_PH_40: {
    manufacturer: Manufacturer.Gillig,

    desc: "Phantom",
    shortDesc: "Phantom",
    length: 40,
    fuelType: FuelType.Diesel,

    articulated: false
  },
  // Gillig Low Floors
  G_LF_29: {
    manufacturer: Manufacturer.Gillig,

    desc: "Low Floor",
    shortDesc: "LF",
    length: 29,
    fuelType: FuelType.Diesel,

    articulated: false
  },
  G_LF_35: {
    manufacturer: Manufacturer.Gillig,

    desc: "Low Floor",
    shortDesc: "LF",
    length: 35,
    fuelType: FuelType.Diesel,

    articulated: false
  },
  G_LF_40: {
    manufacturer: Manufacturer.Gillig,

    desc: "Low Floor",
    shortDesc: "LF",
    length: 40,
    fuelType: FuelType.Diesel,

    articulated: false
  },
  // Gillig Hybrid
  G_LFHE_40: {
    manufacturer: Manufacturer.Gillig,

    desc: "Low Floor Hybrid-Electric Vehicle",
    shortDesc: "LF-HEV",
    length: 40,
    fuelType: FuelType.Hybrid,

    articulated: false
  },
  // Gillig Electric
  G_LFBE_35: {
    manufacturer: Manufacturer.Gillig,

    desc: "Low Floor Battery-Electric",
    shortDesc: "LF-BE",
    length: 35,
    fuelType: FuelType.Electric,

    articulated: false
  },
  G_LFBE_40: {
    manufacturer: Manufacturer.Gillig,

    desc: "Low Floor Battery-Electric",
    shortDesc: "LF-BE",
    length: 40,
    fuelType: FuelType.Electric,

    articulated: false
  },

  // NewFlyer
  NF_DE40LFR: {   // Diesel & Electric (or hybrid) 40ft
    manufacturer: Manufacturer.NewFlyer,

    desc: "Diesel Electric Low Floor",
    shortDesc: "DE40LFR",
    length: 40,
    fuelType: FuelType.Hybrid,

    articulated: false
  },
  NF_D60LFR: {    // Diesel 60ft artic
    manufacturer: Manufacturer.NewFlyer,

    desc: "Diesel Low Floor",
    shortDesc: "D60LFR",
    length: 60,
    fuelType: FuelType.Diesel,

    articulated: true
  },
  NF_DE60LFR: {   // Hybrid artic
    manufacturer: Manufacturer.NewFlyer,

    desc: "Diesel Electric Low Floor",
    shortDesc: "DE60LFR",
    length: 60,
    fuelType: FuelType.Hybrid,

    articulated: true
  },

  // NFI Xcelsiors
  NF_XDE60: {     // Hybrid artic, only 4 of these exist
    manufacturer: Manufacturer.NewFlyer,

    desc: "Xcelsior Diesel Electric",
    shortDesc: "XDE60",
    length: 60,
    fuelType: FuelType.Hybrid,

    articulated: true
  },
  NF_XD60: {      // Diesel artic
    manufacturer: Manufacturer.NewFlyer,

    desc: "Xcelsior Diesel",
    shortDesc: "XD60",
    length: 60,
    fuelType: FuelType.Diesel,

    articulated: true
  },     
  NF_XD40: {      // NEW Diesel 40fts
    manufacturer: Manufacturer.NewFlyer,

    desc: "Xcelsior Diesel",
    shortDesc: "XD40",
    length: 40,
    fuelType: FuelType.Diesel,

    articulated: false
  },

  // NOVA
  NV_LFS: {       // 201-224, 40ft low floor series
    manufacturer: Manufacturer.Nova,

    desc: "Low Floor Series",
    shortDesc: "LFS",
    length: 40,
    fuelType: FuelType.Diesel,

    articulated: false
  },
  NV_LFSA: {      // 6032-6048, NEW 62ft artics with colored front, right, left, and back headsigns
    manufacturer: Manufacturer.Nova,

    desc: "Low Floor Series",
    shortDesc: "LFS Artic",
    length: 62,
    fuelType: FuelType.Diesel,

    articulated: true
  }
} as const satisfies Record<string, VehicleBlurb>;

export const busInfoToShortString = (info: BusInfo | undefined): string => {
  if(!info) 
    return '';
  else 
    return `${info.year} ${info.model.manufacturer === Manufacturer.NewFlyer ? "NFI" : info.model.manufacturer} ${info.model.shortDesc} ${info.model.length}'`;
}

export const busInfoToString = (info: BusInfo | undefined): string => {
  if(!info)
    return 'Unknown Vehicle Model';
  else
    return `${info.year} ${info.model.manufacturer} ${info.model.desc} ${info.model.length}', ${info.model.articulated ? `Articulated ${info.model.fuelType}` : ''}`
}

export const matchesBusInfo = (
  vehicle: string, 
  query?: Partial<BusInfo>
): boolean => {
  const vehicleInfo = getVehicleInformation(vehicle);
  if (query !== undefined)
    for (const prop of Object.keys(query) as (keyof BusInfo)[])
      if (!isUndefinedOrMatches(query[prop], vehicleInfo?.[prop]))
        return false;

  return true;
}

export const filterVehicles = (vehicles: TripVehicle[] | undefined, filters: VehicleFiltering) => {
  const now = Date.now() - HST_UTC_OFFSET * 1000;
  return vehicles?.filter(v => {
    const vehicleInfo = getVehicleInformation(v.number);
    return (filters.includeUnknown || vehicleInfo) &&
    (!filters.hasRoute || v.tripInfo?.routeCode !== undefined) &&
    (!filters.hasDriver || v.driver !== 0) &&
    (!filters.leftHeadsign || vehicleInfo?.leftHeadsign) &&

    (!filters.windowType || filters.windowType.some(w => w === vehicleInfo?.windowType)) &&
    (!filters.windowColor || filters.windowColor.some(c => c === vehicleInfo?.windowColor)) &&
    (!filters.headsignColor || filters.headsignColor.some(hc => hc === vehicleInfo?.headsignColor)) &&

    (!filters.makeModel || filters.makeModel.some(m => VehicleInfo[m] === vehicleInfo?.model)) &&
    (!filters.routeIdFilters || v.tripInfo && filters.routeIdFilters.includes(v.tripInfo.routeId)) &&
    (!filters.lastMessage || filters.lastMessage === ActiveType.ALL ||
      (filters.lastMessage === ActiveType.MONTH   ? (now - v.last_message.getTime()) <= 30 * 24 * 60 * 60 * 1000 :
       filters.lastMessage === ActiveType.WEEK    ? (now - v.last_message.getTime()) <= 7 * 24 * 60 * 60 * 1000 :
    /* filters.lastMessage === ActiveType.DAY */    (now - v.last_message.getTime()) <= 24 * 60 * 60 * 1000))
  }).sort((a, b) => {
    if(!filters.ascendSort) {
      const swap = b;
      b = a;
      a = swap;
    }
    return filters.sortType === SortType.NUMBER ? sortString(a.number, b.number) :
      filters.sortType === SortType.DATE ? sortString(a.number, b.number) + a.last_message.getTime() - b.last_message.getTime() :
      filters.sortType === SortType.ROUTE ? sortRouteCodes(b.tripInfo?.routeCode ?? '', a.tripInfo?.routeCode ?? '') :
      filters.sortType === SortType.ADHERENCE ? b.adherence - a.adherence :
      0;
  });
}

export const BusInfos = {
  G_20_23: {
    model: VehicleInfo.G_LF_29,
    year: "2016",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_30_37: {
    model: VehicleInfo.G_LF_29,
    year: "2020",

    windowColor: WindowColor.Black,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_50_59: {
    model: VehicleInfo.G_LF_35,
    year: "2010",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  G_60_67: {
    model: VehicleInfo.G_LF_35,
    year: "2012",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  NFI_142_150: {
    model: VehicleInfo.NF_D60LFR,
    year: "2007",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  NFI_151_159: {
    model: VehicleInfo.NF_DE60LFR,
    year: "2009",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  NFI_160: {
    model: VehicleInfo.NF_DE60LFR,
    year: "2009",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  NFI_161: {
    model: VehicleInfo.NF_DE60LFR,
    year: "2010",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  NFI_162_180: {
    model: VehicleInfo.NF_DE60LFR,
    year: "2010",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  NFI_181_184: {
    model: VehicleInfo.NF_XDE60,
    year: "2014",

    windowColor: WindowColor.Black,
    windowType: WindowType.Frameless,

    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  NFI_185_194: {
    model: VehicleInfo.NF_XD60,
    year: "2015",

    windowColor: WindowColor.Black,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  NOVA_201_224: {
    model: VehicleInfo.NV_LFS,
    year: "2010",

    windowColor: WindowColor.Black,
    windowType: WindowType.Frameless,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  G_230_279: {
    model: VehicleInfo.G_LF_40,
    year: "2012",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  G_280_297: {
    model: VehicleInfo.G_LF_40,
    year: "2013",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  G_501_520: {
    model: VehicleInfo.G_LF_40,
    year: "2003",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  G_521_555: {
    model: VehicleInfo.G_LF_40,
    year: "2004",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  G_601_629: {
    model: VehicleInfo.G_LF_40,
    year: "2014",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  G_630_663: {
    model: VehicleInfo.G_LF_40,
    year: "2015",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,
    
    leftHeadsign: false,
    headsignColor: HeadsignColor.White
  },
  G_664_669: {
    model: VehicleInfo.G_LF_40,
    year: "2016",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_670_673: {
    model: VehicleInfo.G_LF_40,
    year: "2016",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_674_677: {
    model: VehicleInfo.G_LF_40,
    year: "2017",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_701_708: {
    model: VehicleInfo.G_LF_40,
    year: "2018",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_709_716: {
    model: VehicleInfo.G_LF_40,
    year: "2019",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_854_868: {
    model: VehicleInfo.G_PH_40,
    year: "2003",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  NFI_870_879: {
    model: VehicleInfo.NF_XD60,
    year: "2015",

    windowColor: WindowColor.Black,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  NFI_880_888: {
    model: VehicleInfo.NF_XD60,
    year: "2019",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  NFI_889_896: {
    model: VehicleInfo.NF_XD60,
    year: "2020",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  NFI_901_940: {
    model: VehicleInfo.NF_DE40LFR,
    year: "2006",

    windowColor: WindowColor.Black,
    windowType: WindowType.Individual,

    leftHeadsign: false,
    headsignColor: HeadsignColor.Amber
  },
  G_950_957: {
    model: VehicleInfo.G_LFHE_40,
    year: "2015",

    windowColor: WindowColor.Black,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_958_965: {
    model: VehicleInfo.G_LFHE_40,
    year: "2016",

    windowColor: WindowColor.Black,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_3501: {
    model: VehicleInfo.G_LFBE_35,
    year: "2021",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_4001_4003: {
    model: VehicleInfo.G_LFBE_40,
    year: "2021",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.Colored
  },
  G_4004_4016: {
    model: VehicleInfo.G_LFBE_40,
    year: "2021",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Individual,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  G_4017_4030: {
    model: VehicleInfo.G_LF_40,
    year: "2022",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  NFI_4031_4057: {
    model: VehicleInfo.NF_XD40,
    year: "2024",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.Colored
  },
  NFI_6001_6031: {
    model: VehicleInfo.NF_XD60,
    year: "2022",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.White
  },
  NOVA_6032_6048: {
    model: VehicleInfo.NV_LFSA,
    year: "2024",

    windowColor: WindowColor.Blue,
    windowType: WindowType.Frameless,

    leftHeadsign: true,
    headsignColor: HeadsignColor.Colored
  }
} as const satisfies Record<string, BusInfo>;

export const getVehicleInformation = (vehicle: string): BusInfo | undefined => {
  const vin = parseInt(vehicle);

  // adapting from https://cptdb.ca/wiki/index.php/TheBus
  if (20 <= vin && vin <= 23)
    return BusInfos.G_20_23;
  else if (30 <= vin && vin <= 37)
    return BusInfos.G_30_37;
  else if (50 <= vin && vin <= 59)
    return BusInfos.G_50_59;
  else if (60 <= vin && vin <= 67)
    return BusInfos.G_60_67;
  else if (142 <= vin && vin <= 150)
    return BusInfos.NFI_142_150;
  else if (151 <= vin && vin <= 160)
    return BusInfos.NFI_151_159;
  else if (vin === 160)
    return BusInfos.NFI_160;
  else if (vin === 161)
    return BusInfos.NFI_161;
  else if (162 <= vin && vin <= 180)
    return BusInfos.NFI_162_180;
  else if (181 <= vin && vin <= 184)
    return BusInfos.NFI_181_184;
  else if (185 <= vin && vin <= 194)
    return BusInfos.NFI_185_194;
  else if (201 <= vin && vin <= 224)
    return BusInfos.NOVA_201_224;
  else if (230 <= vin && vin <= 279)
    return BusInfos.G_230_279;
  else if (280 <= vin && vin <= 297)
    return BusInfos.G_280_297;
  else if (501 <= vin && vin <= 520)
    return BusInfos.G_501_520;
  else if (521 <= vin && vin <= 555)
    return BusInfos.G_521_555;
  else if (601 <= vin && vin <= 629)
    return BusInfos.G_601_629;
  else if (630 <= vin && vin <= 663)
    return BusInfos.G_630_663;
  // 666 isn't a bus coz of satanism
  else if ((vin === 664 || vin === 665) || 667 <= vin && vin <= 669)
    return BusInfos.G_664_669;
  else if (670 <= vin && vin <= 673)
    return BusInfos.G_670_673;
  else if (674 <= vin && vin <= 677)
    return BusInfos.G_674_677;
  else if (701 <= vin && vin <= 708)
    return BusInfos.G_701_708;
  // 709-716 has the one line red display
  else if (709 <= vin && vin <= 716)
    return BusInfos.G_709_716;
  else if (854 <= vin && vin <= 868)
    return BusInfos.G_854_868;
  else if (870 <= vin && vin <= 879)
    return BusInfos.NFI_870_879;
  else if (880 <= vin && vin <= 888)
    return BusInfos.NFI_880_888;
  else if (889 <= vin && vin <= 896)
    return BusInfos.NFI_889_896;
  else if (901 <= vin && vin <= 940)
    return BusInfos.NFI_901_940;
  else if (950 <= vin && vin <= 957)
    return BusInfos.G_950_957;
  else if (958 <= vin && vin <= 965)
    return BusInfos.G_958_965;
  else if (vin === 3501)
    return BusInfos.G_3501;
  else if (4001 <= vin && vin <= 4003)
    return BusInfos.G_4001_4003;
  else if (4004 <= vin && vin <= 4016)
    return BusInfos.G_4004_4016;
  else if (4017 <= vin && vin <= 4030)
    return BusInfos.G_4017_4030;
  else if (4031 <= vin && vin <= 4057)
    return BusInfos.NFI_4031_4057;
  else if (6001 <= vin && vin <= 6031)
    return BusInfos.NFI_6001_6031;
  else if (6032 <= vin && vin <= 6048)
    return BusInfos.NOVA_6032_6048;
  
  return undefined;
}

export type BusNums = keyof typeof BusInfos;

// which routes have 29, 35, and 40 footers
export const L29_Routes = [
  '10',  '123',
  '503', '541', '545', '551', '552',
  '671'
];

export const L35_Routes = [
  '14',  '32',
  '122', '151',
  '46',  '414',
  '671', '672', '674'
];

export const L40_Routes = [
  'A',   'C',
  '1',   '1L',
  '2',   '2L',
  '3',   '4',   '5',   '6',   '7',   '8',
  '13',  '20',  '23',  '32',
  '40',  '41',  '43',  '44',  '46',  '47',
  '51',  '52',  '53',  '54',  
  '60',  '61',  '65',  '66',  '67',  '69',
  
  '102',
  '200',
  '301', '303', '306', '307',
  '401', '402', '403', '411', '413', '415', '416', '433', '444', '461',
  '501', '504', '511', '512', '521', '531', '532', '535', '542', '544',
  '651', '673',

  'W3',
  'PH2', 'PH3', 'PH4', 'PH6', 'PH8',
  '80',  '81',  '82',  '83',  '84',  '84A', '85',  '86',  '87',  '88',  '88A', '89',
  '90',  '91',  '91A', '92',  '93',  '94',  '95',  '96',  '96A', '98',  '98A', '99'
]

export const ArticRoutes = [
  '1',  '1L',
  '2',  '2L',
  '20', '42',
  'A',  'E',

  'W1', 'W2', 'W3',
  '81',
  '91', '97',
];

export const ElectricRoutes = [
  '1', '1L',
  '2', '2L',

  '3',  '4',  '6',  '7',  '8',
  '13', 
  '20', '23',
  
  '60', '61', '66', '67', '69',

  '151', 
]

// in progress
export const HybridRoutes = [
  '1', '1L',
  '2', '2L',
  
  '20',
  '40', '42', '43', '46', '47',
  '51', '52', '53', '54',

  '60', '65',

  '411', '433', '444',

  'A',  'C',  'E',

  '91', '93'
];

export const KalihiBusses: BusInfo[] = ([
  'G_30_37', 'G_50_59',

  'G_230_279', 'G_280_297',
  'G_501_520', 'G_521_555',

  'G_701_708', 'G_709_716',
  'G_3501', 'G_4001_4003', 'G_4004_4016',
  'G_4017_4030',

  'NFI_142_150', 'NFI_161', 'NFI_162_180',
  'NFI_870_879', 'NFI_880_888', 'NFI_889_896',
  'NFI_4031_4057',
  
  'NOVA_6032_6048'
] as BusNums[]).map(k => BusInfos[k]);

// kalihi/PC routes determined using https://apps.thebus.org/transitinfo/

export const KalihiRoutes = [
  '1', '1L',
  '2', '2L',
  '3', '4', '5', '6', '7', '8',

  '10', '13', '14', 
  '20', '23', '32',
  '60', '61', '65', '66', '67', '69',

  '102', '122', '123', '151', 
  '200', '234', 
  '301', '302', '303', '306', '307',
  '551', '552',
  '651', '671', '672', '673', '674',

  'W1',  'W3',
  'PH4', 'PH6', 'PH8',
  '80',  '81',  '82',  '83',  '84A', 
  '85',  '86',  '87',  '89',  '91',
  '91A', '93',  '94',  '96A', '97',
  '98',  '98A'
];

export const PearlCityBusses: BusInfo[] = ([
  'G_20_23', 'G_60_67',
  'G_601_629', 'G_630_663', 'G_664_669',
  'G_670_673', 'G_674_677',
  'G_950_957', 'G_958_965',

  'NFI_151_159', 'NFI_160',
  'NFI_181_184', 'NFI_185_194',
  'NFI_901_940', 'NFI_6001_6031',

  'NOVA_201_224'
] as BusNums[]).map(k => BusInfos[k]);

export const PearlCityRoutes = [
  'A', 'C', 'E',
  
  '40', '41', '42', '43', '44', '46', '47',
  '51', '52', '53', '54', 
  '60', '65',

  '401', '402', '403', '411', '413',
  '414', '415', '416', '433', '444',
  '461', '501', '503', '504', '511',
  '512', '521', '531', '532', '533',
  '535', '541', '542', '544', '545',

  'W1',  'W2',
  'PH1', 'PH2', 'PH3', 'PH7',
  '81', '84', '88', '88A', '90',
  '91', '91A', '92', '93', '94',
  '95', '96', '96A', '99'
];