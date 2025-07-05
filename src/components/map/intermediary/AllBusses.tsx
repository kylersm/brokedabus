import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { useMap, StopArrival } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import { ActiveType, SortType, type VehicleFiltering } from "../../Vehicles";
import { filterVehicles } from "~/lib/BusTypes";
import { getHSTTime } from "~/lib/util";
import VehicleFilterOptions from "../../VehicleFilterOptions";
import type { PostRqVehicle } from "~/lib/types";
import { getExpectedTripFromBC } from "~/lib/GTFSBinds";

/**
 * Shows a map of every bus. Accessed using /vehicles/map
 * 
 * When clicking on a vehicle, if it is assigned a trip:
 * - The appropriate shape is drawn
 * - Stops for that trip are shown
 * - For each stop, the time that it should be/have arrived is shown. (The time it arrived then and there is not shown because it's not cached.)
 * 
 * Multiple vehicles can have their information shown at once, filter option is provided.
 * 
 * @returns - A leaflet map.
 */
export function AllBusses() {
  const Map = useMap();

  const { data: heaVehicles } = api.hea.getVehicles.useQuery({ }, {
    refetchInterval: 10 * 1000
    // refetch every 10 seconds
  });

  const [vehicleOfInterest, setVOI] = useState<string[]>([]);
  const [openVehicles, setOpenVehicles] = useState<string[]>([]);
  const vehicles: PostRqVehicle[] | undefined = heaVehicles?.map(v => ({
    ...v, tripInfo: vehicleOfInterest.includes(v.number) ? getExpectedTripFromBC(v.block, v.trip, v.adherence) : v.block?.trips.find(t => t.trips.includes(v.trip ?? ''))
  }));

  const trips = vehicles?.filter(v => openVehicles.includes(v.number)).map(v => v.tripInfo?.trips ?? []).flat(1);
  const { data: allShapes } = api.gtfs.getShapesByTripIDs.useQuery({ tripIds: trips ?? [] }, {
    enabled: !!trips?.length
  });
  const { data: allStops } = api.gtfs.getStopsByTripIDs.useQuery({ tripIds: trips ?? [] }, {
    enabled: !!trips?.length
  });

  const [filters, setFilters] = useState<VehicleFiltering>({
    lastMessage: ActiveType.DAY,
    // sorting doesn't really make sense here
    sortType: SortType.DATE,
    ascendSort: false,
  
    hasRoute: true,
    hasDriver: false,
    includeUnknown: false
  });

  const [showFilter, setSF] = useState<boolean>(false);

  const [now, setNow] = useState<number>(getHSTTime());
  useEffect(() => {
    const interval = setInterval(() => setNow(getHSTTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setVOI(current => current.concat(openVehicles.filter(v => !current.includes(v))));
  }, [openVehicles]);

  return <>
    <VehicleFilterOptions
      showFilter={showFilter}
      setSF={setSF} 
      vehicles={vehicles ?? []}
      filters={filters} setFilters={setFilters}
    />
    <Map
      header={<>
        Showing all busses active in the last 24 hours
        <div onClick={() => setSF(true)} className="underline text-emerald-500 font-normal cursor-pointer w-fit mx-auto">
          Click to see filter options
        </div>
      </>}
      routePath={(allShapes ?? []).sort((a, b) => a.direction - b.direction).map((s) => ({
        direction: s.direction === 1 ? 'East' : 'West',
        routePath: s,
      }))}

      vehicles={filterVehicles(vehicles, filters)}
      vehicleHook={setOpenVehicles}
      wipeBus
      stops={allStops?.map(s => ({
        location: [s.stop.lat, s.stop.lon],
        stop: s.stop.code,
        popup: <StopPopup
          stop={s.stop}
        >
          {s.trips.map(t => {
            const vehicle = vehicles?.find(v => v.tripInfo?.trips.includes(t._id));
            return <StopArrival
              key={s.stop._id + t._id}
              vehicle={vehicle?.number}
              arrives={t.arrives - now - 60 * (vehicle?.adherence ?? 0)}/>;
          })}
        </StopPopup>
      }))}
    />
  </>;
}
