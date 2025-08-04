import type { PolishedStop, SuperficialTrip } from "~/lib/types";
import Link from "next/link";
import ListTrips from "../../ListTrips";
import { type PropsWithChildren, useState } from "react";

/**
 * Used by internal map to add popup text for stops.
 * 
 * TEMPLATE:
 *  Stop [code] - [name]
 *  (List of trips formatted as [Route Chip] [Route Name], if there are more than 5 trips, show an expand/collapse text)
 *  (Child elements if present)
 *  (If no GPS): 'Cannot track ThisBus. Bus either lacks a GPS or it is too soon to assign a vehicle to this stop.'
 * 
 * @returns Popup element
 */
export default function StopPopup(props: PropsWithChildren & { stop: PolishedStop; trips?: SuperficialTrip[]; noGPS?: boolean }) {
  const { stop, trips, noGPS } = props;

  const [expand, setExpand] = useState<boolean>(false);

  return <>
    <div className="text-center font-bold text-lg"><Link 
      className="text-blue-300"
      href={{
        pathname: "/stop/[stop]",
        query: { stop: stop.code }
      }}>Stop {stop.code} - {stop.name}</Link>
    </div>

    {trips && <>
      {(trips.length > 0 && trips.length < 5) || expand ? <ListTrips
        trips={trips}
      /> : ''}

      {trips.length >= 5 ? <div onClick={() => setExpand(!expand)} className="mt-5 underline italic text-center">
        Tap to {expand ? "collapse" : "show all routes served"}.
      </div> : ''}
    </>}

    {props.children}

    {noGPS && <i><br/>Cannot track ThisBus. Bus either lacks a GPS or it is too soon to assign a vehicle to this stop.</i>}
  </>
}