import type { LatLngTuple, Map } from "leaflet";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import RouteChip from "../../Route";
import { useMap, DirectionKey, LastUpdated, refetchInterval } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import type { PolishedArrivalsContainer, TripStopAIO } from "~/lib/types";
import { sortString } from "~/lib/util";
import { useSearchParams } from "next/navigation";

/**
 * Shows a stop's arrivals for a specific route. 
 *   Accessed using /stop/[stop]/map if we want to view all arrivals. 
 *   Add 'route' as a query parameter if you want the page to show you arrivals filtered by the route provided.
 * 
 * When clicking on a bus, the expected time of arrival and distance from the stop is shown. The path it is taking to the stop is also shown.
 * 
 * @param props - The stop to get arrivals for.
 * @returns - A leaflet map.
 */
export function StopRouteBusArrivals(props: { stop: TripStopAIO; }) {
  const { stop } = props;
  const Map = useMap();

  const { data: arrivals } = api.hea.getArrivals.useQuery({ stop: stop.info.code }, {
    refetchInterval
  });

  const [openVehicles, setOpenVehicles] = useState<string[]>([]);

  const fullOpenVehicles = arrivals?.filter(a => a.vehicle && openVehicles.includes(a.vehicle.number)) ?? [];
  const arrivalShapes = fullOpenVehicles.flatMap(a => a.arrivals.map(a => a.trip.shapeId));
  const currentShapes = fullOpenVehicles.map(a => a.vehicle?.tripInfo?.shapeId).filter(s => typeof s === "string");

  const { data: shapes } = api.gtfs.getShapeByShIDs.useQuery({ 
    shids: arrivalShapes.concat(...currentShapes)
  }, {
    enabled: !!arrivals?.length
  });

  const [map, setMap] = useState<Map>();
  const [zoomed, setZoomed] = useState<boolean>();
  const routeSlug = useSearchParams().get("route") ?? undefined;
  const [routeFilter, setRouteFilter] = useState<string>();
  const deduplicatedRoutes = stop.trips.filter((r, i, a) => a.findIndex(rr => rr.routeCode === r.routeCode) === i).sort((a, b) => sortString(a.routeCode, b.routeCode));

  useEffect(() => {
    setRouteFilter(routeSlug);
  }, [routeSlug]);

  // zoom effect
  useEffect(() => {
    if (map && arrivals?.length && !zoomed) {
      const pts = arrivals.filter(a => a.vehicle !== undefined).map(a => [a.vehicle?.lat, a.vehicle?.lon] as LatLngTuple).concat([stop.info.lat, stop.info.lon]);
      if (pts.length) {
        map.fitBounds(pts, {
          padding: [
            Math.round(37 / 3), Math.round(129 / 2.6)
          ]
        });
        setZoomed(true);
      }
    }
  }, [map, zoomed, arrivals, stop]);

  const arrivalsWithFilters = arrivals?.filter((a): a is Required<PolishedArrivalsContainer> => !!a.vehicle && (!routeFilter || a.arrivals.some(a => a.trip.routeCode === routeFilter)));

  return <Map
    refHook={setMap}
    header={<>{routeFilter ?
      <>Incoming busses at Stop {stop.info.code} - {stop.info.name} for route <RouteChip route={{ code: routeFilter }} inline /></> :
      <>Incoming busses for Stop {stop.info.code} - {stop.info.name}</>} {arrivalsWithFilters ? <>({arrivalsWithFilters?.length} bus{arrivalsWithFilters?.length === 1 ? '' : "ses"})</> : ''}<br/>
      {deduplicatedRoutes.length > 1 && <>Filter by route:
        { /* wont center on Safari mobile */ }
        <select 
          onChange={c => setRouteFilter(c.target.value === "allbusses" ? undefined : c.target.value)}
          defaultValue={routeSlug ?? 'allbusses'}
        >
          <option value={"allbusses"}>ALL</option>
          {deduplicatedRoutes.map(r => <option key={r.routeCode} value={r.routeCode}>{r.routeCode}</option>)}
        </select>
      </>}
      <DirectionKey />
      <LastUpdated />
    </>}
    zoom={15}
    wipeBus={routeFilter ? (v) => v.tripInfo?.routeCode !== routeFilter : true}
    vehicles={arrivalsWithFilters ?
      arrivalsWithFilters
        .map(a => ({ 
          ...a.vehicle,
          arrivalInfo: a.arrivals
        }))
      : []}
    vehicleHook={setOpenVehicles}
    center={[stop.info.lat, stop.info.lon]}
    stops={[{
      stop: stop.info.code,
      location: [stop.info.lat, stop.info.lon],
      popup: <StopPopup stop={stop.info} trips={stop.trips} />
    }]}
    routePath={shapes?.map(s => ({
      direction: s.direction === 1 ? 'East' : 'West',
      routePath: s,
      unfocused: !currentShapes.includes(s.shapeId)
    }))} />;
}