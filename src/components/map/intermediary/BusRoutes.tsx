import type { LatLngBoundsExpression, LatLngTuple, Map } from "leaflet";
import { useState, useEffect } from "react";
import type { PolishedRoute } from "~/lib/GTFSTypes";
import { api } from "~/utils/api";
import RouteChip from "../../Route";
import { useMap, isUnfocused, StopArrival, DirectionKey, LastUpdated } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import { getHSTTime } from "~/lib/util";
import { createPostRqVehicles, getExpectedStop, getVehicleNow } from "~/lib/GTFSBinds";


/**
 * Shows a map for a specific route. Accessed using /route/[code]/map
 * 
 * Appropriate shapes and stops for the entire route is fetched on load. All shapes are shown by default.
 * (This approach is better suited for routes rather than loading all busses and routes at once).
 * 
 * When clicking on a vehicle, the appropriate shape and stops are shown. Works for multiple vehicles.
 * 
 * When clicking on a stop, all future and previous arrivals 2 minutes after are shown with all the busses shown, not just the currently open bus.
 * 
 * The direction signs (Westbound | Eastbound) can be clicked on to show all shapes that are going to the ____. Vehicles are not filtered.
 * 
 * @param props - The route object to filter for.
 * @returns - A leaflet map.
 */
export function BusRoutes(props: { route: PolishedRoute; }) {
  const { route } = props;
  const Map = useMap();

  const { data: vehicles } = api.hea.getVehicles.useQuery({ route: route.code }, {
    refetchInterval: 7500,
    select: createPostRqVehicles
  });

  const [openVehicles, setOpenVehicles] = useState<string[]>([]);

  const { data: allShapes } = api.gtfs.getShapesByRoute.useQuery({ routeId: route._id });
  const { data: allStops } = api.gtfs.getStopsByTripIDs.useQuery({ tripIds: vehicles
    ?.map(v => v.tripInfo?.trips)
    .filter(t => Array.isArray(t))
    .flat(1) ?? [] 
  }, {
    enabled: !!vehicles?.length
  });
  const { data: activeFilters } = api.gtfs.getAssociatedShapeStops.useQuery({ tripIds: openVehicles
    .map(v => vehicles?.find(v2 => v2.number === v)?.tripInfo?.trips)
    .filter(t => Array.isArray(t))
    .flat(1)
  }, {
    enabled: !!vehicles?.length
  });

  const [dir, setDir] = useState<number>();
  const [map, setMap] = useState<Map>();
  const [zoomed, setZoomed] = useState<boolean>();

  // zoom effect
  useEffect(() => {
    if (map && allShapes && !zoomed) {
      const pts: LatLngBoundsExpression = allShapes.map(s => [...s.shapes]).flat(1).map(s => [s.lat, s.lon]);
      if (pts.length) {
        map.fitBounds(pts, {
          padding: [
            Math.round(37 / 3), Math.round(129 / 2.6)
          ]
        });
        setZoomed(true);
      }
    }
  }, [map, allShapes, zoomed]);

  const [now, setNow] = useState<number>(getHSTTime());
  useEffect(() => {
    const interval = setInterval(() => setNow(getHSTTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return <Map
    header={<>
      Showing busses on route <RouteChip route={{ code: route.code, id: route._id }} inline /> {route.name}<br />
      <DirectionKey directionHook={setDir}/>
      <LastUpdated/>
    </>}
    routePath={allShapes?.filter(s => (openVehicles.length ? !isUnfocused(openVehicles, s.shapeId, activeFilters?.shapes) : (dir === undefined || s.direction === dir))).map((s) => ({
      direction: (s.direction === 1 ? 'East' : 'West'),
      routePath: s
    }))}
    vehicles={vehicles?.map(v => {
      const info = v.tripInfo?.trips;
      return { ...v, nextStop: getExpectedStop(
        allStops?.filter(s => s.trips.some(t => info?.includes(t._id))).map(s => ({ stop: s.stop, trip: s.trips.find(t => info?.includes(t._id))! })), v.tripInfo, getVehicleNow(v, now)) 
      };
    })}
    vehicleHook={setOpenVehicles}
    refHook={setMap}
    wipeBus={(v) => v.tripInfo?.routeId !== route._id}
    stops={allStops?.filter(s => activeFilters?.stops.includes(s.stop.code)).map(s => ({
      location: [s.stop.lat, s.stop.lon] as LatLngTuple,
      stop: s.stop.code,
      popup: <StopPopup
        stop={s.stop}
        trips={[]}
      >
        {s.trips.sort((a, b) => a.arrives - b.arrives).filter(t => (t.arrives - now) > -120).map(t => {
          const vehicle = vehicles?.find(v => v.tripInfo?.trips.includes(t._id));
          return <StopArrival
            key={s.stop._id + t._id}
            vehicle={vehicle?.number}
            arrives={t.arrives - getVehicleNow(vehicle, now)} />;
        })}
      </StopPopup>
    }))} />;
}
