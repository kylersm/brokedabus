import type { Map } from "leaflet";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import RouteChip from "../../Route";
import { useMap, DirectionKey, LastUpdated, StopArrival } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import { createPostRqVehicle, getExpectedStop, getVehicleNow } from "~/lib/GTFSBinds";
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

  const { data: vehicleInfo, isFetched, isFetching } = api.hea.getVehicle.useQuery({ vehicleNum: vehicle }, {
    refetchInterval: 7.5 * 1000,
    select: createPostRqVehicle
  });

  const { data: stops } = api.gtfs.getStopsByTripID.useQuery({ tripId: vehicleInfo?.tripInfo?.trips ?? [] }, {
    enabled: !!vehicleInfo?.tripInfo?.trips.length
  });
  const { data: shapes } = api.gtfs.getShapeByShID.useQuery({ shid: vehicleInfo?.tripInfo?.shapeId ?? "" }, {
    enabled: !!vehicleInfo?.tripInfo
  });

  const [now, setNow] = useState<number>(getVehicleNow(vehicleInfo));
  const [map, setMap] = useState<Map>();
  const [framed, setFramed] = useState<boolean>();

  useEffect(() => {
    const interval = setInterval(() => setNow(getVehicleNow(vehicleInfo)), 1000);
    return () => clearInterval(interval);
  }, [vehicleInfo]);

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
      loading={isFetching && vehicleInfo === undefined}
      refHook={setMap}
      header={<>
        Monitoring Bus {vehicle} {vehicleInfo?.tripInfo ? <>
          on Route <RouteChip route={{ code: vehicleInfo.tripInfo.routeCode, id: vehicleInfo.tripInfo.routeId }} inline /> {vehicleInfo.tripInfo.headsign}
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
        stale: s.trip.arrives - now < 0,
        popup: <StopPopup stop={s.stop}>
          <StopArrival key={s.stop._id + s.trip._id} arrives={s.trip.arrives - now} oneVehicle/>
        </StopPopup>
      })) : []}
      vehicles={vehicleInfo ? [{ ...vehicleInfo, nextStop: getExpectedStop(stops, vehicleInfo.tripInfo, now) }] : []} 
    />
  </>;
}
