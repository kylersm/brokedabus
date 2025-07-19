import type { Map } from "leaflet";
import { useState, useEffect, useRef } from "react";
import { api } from "~/utils/api";
import RouteChip from "../../Route";
import { useMap, DirectionKey, LastUpdated, StopArrival } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import { getHSTTime } from "~/lib/util";
import { getExpectedTripFromBC } from "~/lib/GTFSBinds";
import HeadTitle from "../../HeadTitle";
import NotFound from "../../NotFound";

/**
 * Shows a map focused on one vehicle. Accessed using /vehicle/[number]/map
 * 
 * If a trip is assigned to the vehicle, the appropriate shape and stops are shown. 
 * 
 * Stops that have already been passed are marked as gray.
 * 
 * @param props - The vehicle number to look for.
 * @returns - A leaflet map.
 */
export function OneVehicle(props: { vehicle: string; }) {
  const { vehicle } = props;
  const Map = useMap();

  const { data: vehicleInfo, isFetched } = api.hea.getVehicle.useQuery({ vehicleNum: vehicle }, {
    refetchInterval: (r) => {
      if (r.state.error)
        return false;
      else return 10000;
    }
  });

  const tripInfo = vehicleInfo ? getExpectedTripFromBC(vehicleInfo.block, vehicleInfo.trip, vehicleInfo.adherence) : undefined;
  const { data: stops } = api.gtfs.getStopsByTripID.useQuery({ tripId: tripInfo?.trips ?? [] }, {
    enabled: !!tripInfo?.trips.length
  });
  const { data: shapes } = api.gtfs.getShapeByShID.useQuery({ shid: tripInfo?.shapeId ?? "" }, {
    enabled: !!tripInfo
  });

  const getNow = () => (getHSTTime() + (vehicleInfo ? 60 * vehicleInfo.adherence : 0)) % (24 * 60 * 60);

  const now = useRef<number>(getNow());
  const [map, setMap] = useState<Map>();
  const [framed, setFramed] = useState<boolean>();

  const difference = stops?.some(s => (s.trip.arrives - now.current) >= 18 * 60 * 60) ? 24 * 60 * 60 : 0;
  useEffect(() => {
    const interval = setInterval(() => now.current = getNow(), 1000);
    return () => clearInterval(interval);
  }, [vehicleInfo, getNow]);

  useEffect(() => {
    if (map && vehicleInfo && !framed) {
      map.setView([vehicleInfo.lat, vehicleInfo.lon], 15);
      setFramed(true);
    }
  }, [vehicleInfo, map, framed]);

  if (!vehicleInfo && isFetched) return <NotFound errorMessage="Vehicle doesn't exist">
    <HeadTitle>Unknown Vehicle</HeadTitle>
    <i>Given vehicle: <pre className='inline'>{vehicle}</pre></i>
  </NotFound>;

  return <>
    <HeadTitle>{`Bus ${vehicle} Map`}</HeadTitle>
    <Map
      refHook={setMap}
      header={<>
        Monitoring Bus {vehicle} {tripInfo ? <>
          on Route <RouteChip route={{ code: tripInfo.routeCode, id: tripInfo.routeId }} inline /> {tripInfo.headsign}
        </> : ' with no active trip'}
        <DirectionKey />
        <LastUpdated />
      </>}
      routePath={shapes ? [{
        direction: shapes.direction === 1 ? 'West' : 'East',
        routePath: shapes
      }] : []}
      stops={stops ? stops.map((s) => ({
        location: [s.stop.lat, s.stop.lon],
        stop: s.stop.code,
        stale: s.trip.arrives - now.current - difference < 0,
        popup: <StopPopup stop={s.stop}>
          <StopArrival key={s.stop._id + s.trip._id} arrives={s.trip.arrives - now.current - difference} oneVehicle/>
        </StopPopup>
      })) : []}
      vehicles={vehicleInfo ? [{ ...vehicleInfo, tripInfo }] : []} 
    />
  </>;
}
