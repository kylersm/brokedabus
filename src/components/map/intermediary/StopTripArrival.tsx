import { useState, useEffect } from "react";
import { type TripStopAIO, PolishedArrivalContainer } from "~/lib/types";
import { HSTify } from "~/lib/util";
import { api } from "~/utils/api";
import { useMap, refetchInterval, DirectionKey, LastUpdated } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import type { Map } from "leaflet";

/**
 * Shows an arrival at a stop for a vehicle. Accessed using /stop/[stop]/map/[trip]
 * 
 * When clicking on the bus, the ETA, distance from stop and schedule adherence are shown.
 * After the arrival is removed from the API, the bus should continue to 'move' on the map.
 * 
 * @param props - The stop to base the arrival on, and the trip number to search for in arrivals.
 * @returns - A leaflet map.
 */
export function StopTripArrival(props: { stop: TripStopAIO; trip: string; }) {
  const { stop, trip } = props;
  const Map = useMap();

  // we need two states because arrivalCache is initially undefined (we want the latest request)
  const [arrivalGone, setArrivalGone] = useState<boolean>();
  const [arrivalCache, setArrivalCache] = useState<Partial<PolishedArrivalContainer>>();

  const { data: shape } = api.gtfs.getShapeByShID.useQuery({ shid: arrivalCache?.arrival?.trip.shapeId ?? "" }, {
    enabled: !!arrivalCache?.arrival
  });

  const arrival = api.hea.getArrivalIfExists.useQuery({ stop: stop.info.code, trip, vehicle: arrivalCache?.vehicle?.number }, {
    refetchInterval: (_query) => {
      if (arrivalGone)
        return false;
      else
        return refetchInterval;
    }
  });

  // polished arrival and check if arrival is expired effect
  useEffect(() => {
    if (arrival.isSuccess) {
      if (arrival.data === undefined)
        setArrivalGone(true);
      else {
        setArrivalCache(arrival.data);
      }
    }
  }, [arrival.isSuccess, arrival.data, stop.info.code]);

  const [map, setMap] = useState<Map>();
  const [zoomed, setZoomed] = useState<boolean>();
  // zoom effect
  useEffect(() => {
    if (map && !zoomed && arrivalCache?.vehicle) {
      map.fitBounds([
        [arrivalCache.vehicle.lat, arrivalCache.vehicle.lon],
        [stop.info.lat, stop.info.lon]
      ], {
        padding: [
          Math.round(37 / 3), Math.round(129 / 2.6)
        ]
      });
      setZoomed(true);
    }
  }, [map, zoomed, arrivalCache, stop.info]);

  return <Map
    refHook={setMap}
    header={<>
      {arrivalCache?.vehicle ? <>Monitoring Bus {arrivalCache.vehicle.number} for Stop {stop.info.code}</> : 'No GPS to follow'}
      {arrivalCache?.arrival && `, ${arrivalCache.arrival.departing ? "depart" : "arriv"}ing at ${HSTify(arrivalCache.arrival.stopTime, true)}`}
      {arrivalCache?.arrival?.status === "Canceled" ? <div className="text-red-500 font-bold">ARRIVAL CANCELED</div> : 
      arrivalCache?.arrival?.status === "Uncanceled" ? <div className="text-green-500 font-bold">TRIP IS UNCANCELED</div> : 
      <DirectionKey/>}
      <LastUpdated />
    </>}
    // without arrivalCache, vehicle wouldnt exist
    vehicles={arrivalCache?.vehicle ? [{
      ...arrivalCache.vehicle,
      arrivalInfo: arrivalCache.arrival ? [arrivalCache.arrival] : undefined,
    }] : []}
    center={[stop.info.lat, stop.info.lon]}
    zoom={15}
    noGPS={!arrivalCache?.vehicle}
    stops={[{
      stop: stop.info.code,
      location: [stop.info.lat, stop.info.lon],
      popup: <StopPopup stop={stop.info} noGPS={!arrivalCache?.vehicle} />
    }]}
    routePath={shape && arrivalCache ? [{
      direction: shape.direction === 1 ? 'East' : 'West',
      unfocused: arrivalCache?.arrival?.status === "Canceled",
      routePath: shape
    }] : []} />;
}
