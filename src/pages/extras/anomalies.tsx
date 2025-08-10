import type { JSX } from "react";
import HeadTitle from "~/components/HeadTitle";
import RouteChip from "~/components/Route";
import PadPage from "~/components/templates/PadPage";
import { ArticRoutes, ElectricRoutes, FuelType, getVehicleInformation, HybridRoutes, KalihiBusses, KalihiRoutes, L29_Routes, L35_Routes, L40_Routes, PearlCityBusses, PearlCityRoutes } from "~/lib/BusTypes";
import * as GTFSBinds from "~/lib/GTFSBinds";
import type * as Types from "~/lib/types";
import { api } from "~/utils/api";

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

    if(vehicleInfo.model.length === 29 && !L29_Routes.includes(vehicle.tripInfo.routeCode))
      msg.push(<div>
        29 Footer {blurb}
      </div>);

    if(vehicleInfo.model.length === 35 && !L35_Routes.includes(vehicle.tripInfo.routeCode))
      msg.push(<div>
        35 Footer {blurb}
      </div>);

    if(vehicleInfo.model.length === 40 && !L40_Routes.includes(vehicle.tripInfo.routeCode))
      msg.push(<div>
        40 Footer {blurb}
      </div>);
    
  }

  return <PadPage>
    <HeadTitle>
      Anomalies
    </HeadTitle>
    <div>
      Vehicle Anomalies
    </div>
    {msg.length ? msg : <i>No anomalies found.</i>}
  </PadPage>;
}