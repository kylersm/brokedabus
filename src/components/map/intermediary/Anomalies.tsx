import { createPostRqVehicles } from "~/lib/GTFSBinds";
import { api } from "~/utils/api";
import { useMap } from "../mapIntermediate";
import { PearlCityBusses, PearlCityRoutes, KalihiBusses, KalihiRoutes, ArticRoutes, FuelType, ElectricRoutes, HybridRoutes, L29_Routes, L35_Routes, L40_Routes, getVehicleInformation } from "~/lib/BusTypes";

export function Anomalies() {
  const Map = useMap();

  const { data: vehicles } = api.hea.getVehicles.useQuery({ }, {
    refetchInterval: 10 * 1000,
    select: createPostRqVehicles
  });

  return <Map
    vehicles={vehicles?.filter(v => {
      // yikes
      const vehicleInfo = getVehicleInformation(v.number);
      if(!vehicleInfo || !v.tripInfo) return false;

      if(PearlCityBusses.includes(vehicleInfo) && !PearlCityRoutes.includes(v.tripInfo?.routeCode.toUpperCase()))
        return true;

      if(KalihiBusses.includes(vehicleInfo) && !KalihiRoutes.includes(v.tripInfo?.routeCode.toUpperCase()))
        return true;

      if(vehicleInfo.model.articulated && !ArticRoutes.includes(v.tripInfo.routeCode))
        return true;

      if(vehicleInfo.model.fuelType === FuelType.Electric && !ElectricRoutes.includes(v.tripInfo.routeCode))
        return true;

      if(vehicleInfo.model.fuelType === FuelType.Hybrid && !HybridRoutes.includes(v.tripInfo.routeCode))
        return true;

      if(vehicleInfo.model.length === 29 && !L29_Routes.includes(v.tripInfo.routeCode))
        return true;

      if(vehicleInfo.model.length === 35 && !L35_Routes.includes(v.tripInfo.routeCode))
        return true;

      if(vehicleInfo.model.length === 40 && !L40_Routes.includes(v.tripInfo.routeCode))
        return true;
      }
    )}
  />;
}