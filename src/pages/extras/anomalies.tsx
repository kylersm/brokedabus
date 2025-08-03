import type { JSX } from "react";
import HeadTitle from "~/components/HeadTitle";
import RouteChip from "~/components/Route";
import PadPage from "~/components/templates/PadPage";
import { type BusInfo, BusInfos, FuelType, getVehicleInformation } from "~/lib/BusTypes";
import * as GTFSBinds from "~/lib/GTFSBinds";
import type * as Types from "~/lib/types";
import { api } from "~/utils/api";

type BusNums = keyof typeof BusInfos;

const ArticRoutes = [
  '1',  '1L',
  '2',  '2L',
  '20', '42',
  'A',  'E',

  'W1', 'W2', 'W3'
];

const ElectricRoutes = [
  '1', '1L',
  '2', '2L',

  '3',  '4', '6', '7', '8',
  '13', '20', '60', '61', '66', '67',

  '151', 
]

// in progress
const HybridRoutes = [
  '1', '1L',
  '2', '2L',
  
  '20',
  '40', '42', '43', '46', '47',
  '51', '52', '53', '54',

  '411', '433', '444',

  'A',  'C',  'E'
];

const KalihiBusses: BusInfo[] = ([
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

const KalihiRoutes = [
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


const PearlCityBusses: BusInfo[] = ([
  'G_20_23', 'G_60_67',
  'G_601_629', 'G_630_663', 'G_664_669',
  'G_670_673', 'G_674_677',
  'G_950_957', 'G_958_965',

  'NFI_151_159', 'NFI_160',
  'NFI_181_184', 'NFI_185_194',
  'NFI_901_940', 'NFI_6001_6031',

  'NOVA_201_224'
] as BusNums[]).map(k => BusInfos[k]);

const PearlCityRoutes = [
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

export default function Anomalies() {
  const { data: vehicles } = api.hea.getVehicles.useQuery({}, {
    refetchInterval: 7500
  });

  const tripVehicles: Required<Types.TripVehicle>[] = vehicles?.
    map(v => ({...v, tripInfo: GTFSBinds.getExpectedTrip(v.block)})).
    filter((v): v is Required<Types.TripVehicle> => v.tripInfo !== undefined) ?? [];

  const msg: JSX.Element[] = [];
  
  for(const vehicle of tripVehicles) {
    const vehicleInfo = getVehicleInformation(vehicle.number);
    if(!vehicleInfo) continue;
    const blurb = <>Bus {vehicle.number} is on route <RouteChip inline route={{ code: vehicle.tripInfo.routeCode, id: vehicle.tripInfo.routeId }}/> {vehicle.tripInfo.headsign}</>;
    if(PearlCityBusses.includes(vehicleInfo) && !PearlCityRoutes.includes(vehicle.tripInfo?.routeCode.toUpperCase()))
      msg.push(<div>
        Pearl City {blurb}
      </div>);

    if(KalihiBusses.includes(vehicleInfo) && !KalihiRoutes.includes(vehicle.tripInfo?.routeCode.toUpperCase()))
      msg.push(<div>
        Kalihi {blurb}
      </div>);

    if(vehicleInfo.model.articulated && !ArticRoutes.includes(vehicle.tripInfo.routeCode))
      msg.push(<div>
        Articulated {blurb}
      </div>);

    if(vehicleInfo.model.fuelType === FuelType.Electric && !ElectricRoutes.includes(vehicle.tripInfo.routeCode))
      msg.push(<div>
        Electric {blurb}
      </div>);

    if(vehicleInfo.model.fuelType === FuelType.Hybrid && !HybridRoutes.includes(vehicle.tripInfo.routeCode))
      msg.push(<div>
        Hybrid {blurb}
      </div>);

    
  }

  return <PadPage>
    <HeadTitle>
      Anomalies
    </HeadTitle>
    <div>
      Vehicle Anomalies
    </div>
    {msg}
  </PadPage>;
}