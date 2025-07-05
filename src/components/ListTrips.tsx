import type { SuperficialTrip } from "~/lib/types";
import RouteChip from "./Route";
import ListItem from "./ListItem";
import { useState } from "react";
import { sortRouteCodes } from "~/lib/util";
import Button from "./Button";

/**
 * List of trips to convey in an element
 * 
 * TEMPLATE:
 *  [Route Chip] [Headsign]
 * 
 * Additionally, a button used to compress the trips to chip only is shown if asked for.
 * 
 * @param props - See below.
 * @returns - A react element.
 */
export default function ListTrips(props: { 
  // List of trips to show
  trips: SuperficialTrip[]; 
  // Whether or not the text to compress the list is shown.
  allowCompression?: boolean; 
  // Whether or not the list is compressed by default.
  compress?: boolean; 
  // Key to use if multiple trip lists are shown (e.g. favorites or search)
  key?: string; 
  // Whether or not to hide the routes served text. (makes sense in some places)
  hideRoutes?: boolean; 
}) {
  const [compressChips, setCompress] = useState<boolean>(props.compress ?? false);
  const deduplicatedRoutes = props.trips.filter((r, i, a) => a.findIndex(rr => rr.routeCode === r.routeCode) === i).sort((a, b) => sortRouteCodes(a.routeCode, b.routeCode));
  if(!props.trips.length) return <i>No routes served.</i>;
  else return (<div className='break-words text-wrap'>
    {!props.hideRoutes && <span className="font-semibold">{props.trips.length > 1 ? "Routes" : "Route"} served: </span>}
    { 
      compressChips ?
      deduplicatedRoutes.map((r, i) => <div className="inline" key={props.key + r.headsign + r.routeId}>{i > 0 ? ' ' : ''}
        <RouteChip route={{ code: r.routeCode, id: r.routeId }} inline/>
      </div>) :
      <table className="border-spacing-y-1 ml-4 text-left">
        <tbody>
          {props.trips.filter((t, i, a) => a.findIndex(t2 => t2.displayCode === t.displayCode) === i).sort((a, b) => sortRouteCodes(a.routeCode, b.routeCode)).map(t => <ListItem
            key={t.routeId+t.headsign}
            emoji={<RouteChip route={{ code: t.routeCode, id: t.routeId}}/>}
            topEmoji
          >
            {t.headsign}
          </ListItem>)}
        </tbody>
      </table>
    }
    {props.allowCompression && 
    <div className="mt-5">
      <Button onClick={() => setCompress(!compressChips)}>
        Click to {compressChips ? 'show' : 'hide'} route headsigns
      </Button>
    </div>}
  </div>);
}