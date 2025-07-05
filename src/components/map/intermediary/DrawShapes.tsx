import type { LatLngBoundsExpression, Map } from "leaflet";
import { useState, useEffect } from "react";
import type { TripWithShape } from "~/lib/types";
import { quantifyMiles } from "~/lib/util";
import RouteChip from "../../Route";
import { useMap, DirectionKey } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import { api } from "~/utils/api";

/**
 * Shows a map of shapes (NO VEHICLES) and their stops. Accessed using /shape/[shids]
 * 
 * Draws the shapes and their directions, then the stops for each shape. 
 * 
 * If two different shapes have the same stop, the pop-up will show a list of routes serving that stop.
 * 
 * Duplicate shape IDs are ignored, and only the first 10 shape IDs are used to prevent server overload.
 * 
 * Map header is used to show the different routes and their lengths.
 * 
 * @param props - A list of shape IDs to fetch, and routes to assign to each shape ID.
 * @returns - A leaflet map.
 */
export function DrawShapes(props: { shids: string[]; routes: TripWithShape[]; }) {
  const Map = useMap();
  const { shids, routes } = props;

  // expand the list of shapes to show route chips and names
  const [expand, setExpand] = useState<boolean>(false);

  const { data: shapesAndStops } = api.gtfs.getShapesWithStopsByShIDs.useQuery({ shids });

  const [map, setMap] = useState<Map>();
  useEffect(() => {
    if (map && shapesAndStops) {
      const pts: LatLngBoundsExpression = shapesAndStops.stops.map(s => [s.lat, s.lon]);
      const highestStopLng = pts.reduce((p, s) => p[1] > s[1] ? s : p);
      highestStopLng[1] += 0.5;
      if (pts.length) {
        map.fitBounds(pts.concat(highestStopLng), {
          padding: [
            Math.round(37 / 3), Math.round(129 / 2.6)
          ]
        });
      }
    }
  }, [map, shapesAndStops]);

  return <Map
    refHook={setMap}
    routePath={routes && shapesAndStops ? shapesAndStops.shapes.sort((a, b) => a.direction - b.direction).map(shape => ({
      direction: shape.direction === 1 ? 'East' : 'West',
      routePath: shape
    })) : []}
    header={<span onClick={() => setExpand(!expand)} className={shids.length >= 4 ? "cursor-pointer" : ""}>
      {shids.length < 4 || expand ?
        <>
          Map for route{(shapesAndStops?.shapes ?? shids).length > 1 ? 's' : ''} {routes && shapesAndStops?.shapes ?
            routes
              .map(r => ({
                ...r,
                length: shapesAndStops.shapes.find(s => s.shapeId === r.shapeId)?.length
              }))
              .map(r => <span key={r.shapeId} className="mr-2">
                <RouteChip route={{ code: r.routeCode, id: r.routeId }} inline /> {r.headsign} {r.length !== undefined && <span className="text-sm top-0 font-normal">({quantifyMiles(r.length / 1609.344)})</span>}
              </span>)
            : [...shids.map(s => s.split('_')[0]!.slice(0, -4))].join(", ")}<br />
          <DirectionKey />
        </>
        : <>Map for {shids.length} routes</>}
    </span>}
    stops={shapesAndStops ? shapesAndStops.stops.map(s => ({
      location: [s.lat, s.lon],
      stop: s.code,
      popup: <StopPopup
        stop={s}
        trips={shids.length > 1 ? (routes ?? []).filter(c => s.shapes.includes(c.shapeId)) : []} />
    })) : []} />;
}
