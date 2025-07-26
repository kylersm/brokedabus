import RouteChip from "../../Route";
import { arrivalString, getHSTTime, HST_UTC_OFFSET, HSTify, quantifyMiles, quantifyTime } from "~/lib/util";
import { busInfoToShortString, getVehicleInformation } from "~/lib/BusTypes";
import type { SuperficialVehicle } from "../map";
import Link from "next/link";
import { getNextTripLayover } from "~/lib/GTFSBinds";

/**
 * Used by internal map to add popup text for vehicles.
 * 
 * TEMPLATE:
 *        Bus [Number] (year, make & model)
 *  [If this is from arrivals:
 *    Future Trip: [Chip] [Headsign]
 *    [Dep/Arr] in [time]
 *    [Distance in miles] away from stop
 *  ]
 *  [Adherence; [Time] behind/ahead of schedule]
 *  [If block info is present, one is shown:
 *    [On layover until...]         -
 *    [Driver may skip layover...]  -- Next trip details (route chip and headsign) are also shown
 *    [Next trip is starting]       -
 *    [Nothing if in middle of trip]
 *    [Ended last trip, so go back to facility]
 *    [Last trip for bus]
 *  ]
 *  -----------------------------------------------
 *  [Trip?]  [Block?]  [Driver or 'Unknown Driver']
 *              LAST UPDATED [Date]
 * 
 * @returns Popup element
 */
export default function VehiclePopup(props: { 
  vehicle: SuperficialVehicle; 
  vehiclePage?: boolean;
}) {
  const { vehicle, vehiclePage } = props;

  const arrival = vehicle.arrivalInfo;

  const info = getVehicleInformation(vehicle.number);
  const routeChip = vehicle.tripInfo ? <RouteChip 
    route={{ 
      code: vehicle.tripInfo.routeCode, 
      id: vehicle.tripInfo.routeId 
    }}
    inline
  /> : <>No Route Assigned</>;
   
  const headsign = vehicle.tripInfo?.headsign;
  const blocks = getNextTripLayover(vehicle.block, vehicle.tripInfo);

  // prints vehicle's adherence to schedule IF vehicle given, otherwise print direction of bus from arrival
  // complicated line of code to handle grammar with counting minutes and whether the bus is behind/ahead of/on
  // if vehicle wasnt given we'll just say where it's going
  // refer to https://hea.thebus.org/api/documentation/vehicleJSON.pdf on how adherence works
  const schedule = vehicle ? 
                                 // about 1 second
    (Math.abs(vehicle.adherence) <= 0.02 ? "On" : 
      quantifyTime(Math.abs(vehicle.adherence * 60)) + ' ' +
    (vehicle.adherence > 0 ? "ahead of" : "behind")) + " schedule" : `Headed ${arrival?.trip.direction ? "Eastbound" : "Westbound"}`;

  const now = getHSTTime();
  const tripNow = now + vehicle.adherence * 60;
  const currentIsTmrw = tripNow >= 24 * 60 * 60;
  const nextDelta = (blocks?.next?.firstArrives ?? 0) > (24 * 60 * 60) && currentIsTmrw ? 24 * 60 * 60 : 0;
  const nextTrip = blocks?.next ? <div className="mt-2">
    <b>Next trip:</b> <RouteChip route={{ code: blocks.next.routeCode, id: blocks.next.routeId }} inline/> {blocks.next.headsign}
  </div> : <></>;
  return <>
    {!vehiclePage && <>
      <div className="text-center font-bold text-lg"><Link className="text-blue-500 underline" href={{
        pathname: "/vehicle/[vehicle]",
        query: { vehicle: vehicle.number }
      }}>Bus {vehicle.number}</Link> {info && <span className="font-normal italic text-sm">{busInfoToShortString(info)}</span>}</div>
      <div className="text-center mb-2">{routeChip} {headsign}</div>
    </>}
    {arrival &&  <>
      <div className="font-bold text-center">{`${arrival.departing ? "Departing" : "Arriving"} ${arrivalString(arrival.stopTime)}`}</div>
      <div className="italic text-center -mb-2">{quantifyMiles(arrival.distance / 1603.344)} away from stop</div>
      {!vehicle?.tripInfo?.trips.some(t => arrival.trip.trips.includes(t)) && <i><br/>As <RouteChip route={{ code: arrival.trip.routeCode, id: arrival.trip.routeId }} inline/> {arrival.trip.headsign}</i>}<br/>
    </>}
    {schedule}<br/>
    {blocks && <>{
      blocks.next ? 
        (tripNow+nextDelta > blocks.end || (vehicle.adherence >= 0 && now+nextDelta > blocks.end)) && now+nextDelta < blocks.next.firstArrives  ? <>
          On layover until {HSTify(new Date((blocks.next.firstArrives + HST_UTC_OFFSET) * 1000), true)}<br/>
          {nextTrip}
        </> :
        tripNow+nextDelta > blocks.end && tripNow+nextDelta >= blocks.next.firstArrives && now+nextDelta <= blocks.next.firstArrives ? <>
          Driver may skip layover<br/>
          {nextTrip}
        </> :
        tripNow+nextDelta >= blocks.next.firstArrives ? <>
          Next trip is starting.<br/>
          {nextTrip}
        </> :
      // BAU 
      <>
        {/* todo: add some sort of next stop thing? */}
      </> : tripNow+nextDelta > blocks.end ? <>
        Ended last trip; heading back to bus facility
      </> : <>
        Last trip for bus.
      </>
    }</>}
    <hr className="my-2"/>
    <div className="flex gap-x-4 w-fit mx-auto">
      {vehicle.tripInfo?.trips ? <span>Trip {vehicle.tripInfo.trips.join(', ')}</span> : ''}
      {vehicle.block ? <span>Block {vehicle.block.name.split('-')[1]}</span> : ''}
      {vehicle.driver ? <span>Driver {vehicle.driver}</span> : <i>Unknown driver</i>}
    </div>
    {vehicle.last_message ? <div className="text-center italic pr-1">LAST UPDATED {HSTify(vehicle.last_message, !vehiclePage)}</div> : ''}
  </>
}