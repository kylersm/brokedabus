import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { useMap, StopArrival } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import { ActiveType, SortType, type VehicleFiltering } from "../../Vehicles";
import { filterVehicles } from "~/lib/BusTypes";
import { areArraysSimilar, getHSTTime } from "~/lib/util";
import VehicleFilterOptions from "../../VehicleFilterOptions";
import { createPostRqVehicles, getExpectedStop, getVehicleNow } from "~/lib/GTFSBinds";

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

  const { data: vehicles } = api.hea.getVehicles.useQuery({ }, {
    refetchInterval: 10 * 1000,
    // refetch every 10 seconds
    select: createPostRqVehicles
  });

  const [openVehicles, setOpenVehicles] = useState<string[]>([]);

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

  const filteredVehicles = filterVehicles(vehicles, filters);
  const numbers = filteredVehicles?.map(v => v.number) ?? [];
  const [showFilter, setSF] = useState<boolean>(false);

  const [now, setNow] = useState<number>(getHSTTime());
  useEffect(() => {
    const interval = setInterval(() => setNow(getHSTTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return <>
    <VehicleFilterOptions
      showFilter={showFilter}
      setSF={setSF} 
      vehicles={vehicles ?? []}
      filters={filters} setFilters={setFilters}
    />
    <Map
      header={<>
        Showing all busses active {
          filters.lastMessage === ActiveType.ALL ? "whenever" : 
          filters.lastMessage === ActiveType.MONTH ? "in the last 30 days" :
          filters.lastMessage === ActiveType.WEEK ? "in the past week" : "in the past 24 hours"
        }
        <div onClick={() => setSF(true)} className="underline text-emerald-500 font-normal cursor-pointer w-fit mx-auto">
          Click to see filter options
        </div>
      </>}
      routePath={(allShapes ?? []).sort((a, b) => a.direction - b.direction).map((s) => ({
        direction: s.direction === 1 ? 'East' : 'West',
        routePath: s,
      }))}

      vehicles={filteredVehicles?.map(v => {
        const info = v.tripInfo?.trips;
        return { ...v, nextStop: getExpectedStop(
          allStops?.filter(s => areArraysSimilar(s.trips.map(t => t._id), info)).map(s => ({ stop: s.stop, trip: s.trips.find(t => info?.includes(t._id))! })), v.tripInfo, getVehicleNow(v, now)) 
        };
      })}
      vehicleHook={setOpenVehicles}
      wipeBus={(v) => !numbers.includes(v.number)}
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
              arrives={t.arrives - getVehicleNow(vehicle, now)}/>;
          })}
        </StopPopup>
      }))}
    />
  </>;
}
