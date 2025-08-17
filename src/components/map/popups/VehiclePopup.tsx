import RouteChip from "../../Route";
import { areArraysSimilar, arrivalString, HST_UTC_OFFSET, HSTify, quantifyMiles, quantifyTime } from "~/lib/util";
import { busInfoToShortString, getVehicleInformation } from "~/lib/BusTypes";
import type { SuperficialVehicle } from "../map";
import Link from "next/link";
import { getNextTripLayover, getVehicleNow } from "~/lib/GTFSBinds";

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
 *  [Adherence: [Time] behind/ahead of schedule]
 *  [If block info is present, one is shown:
 *    [On layover until...]         -
 *    [Driver may skip layover...]  -- Next trip details (route chip and headsign) are also shown if it doesn't match arrival trips
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

  const arrivals = vehicle.arrivalInfo;

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
  const schedule = // about 1 second
    (Math.abs(vehicle.adherence) <= 0.02 ? "On" : 
      quantifyTime(Math.abs(vehicle.adherence * 60)) + ' ' +
    (vehicle.adherence > 0 ? "ahead of" : "behind")) + " schedule";

  const vehicleNow = getVehicleNow(vehicle);
  const nextTrip = !arrivals && blocks?.next ? <div className="mt-2">
    <b>Next trip:</b> <RouteChip route={{ code: blocks.next.routeCode, id: blocks.next.routeId }} inline/> {blocks.next.headsign}
  </div> : null;
  return <>
    {!vehiclePage && <>
      <div className="text-center font-bold text-lg"><Link className="link" href={{
        pathname: "/vehicle/[vehicle]",
        query: { vehicle: vehicle.number }
      }}>Bus {vehicle.number}</Link> {info && <span className="font-normal italic text-sm">{busInfoToShortString(info)}</span>}</div>
      <div className="text-center mb-2">{routeChip} {headsign}</div>
    </>}
    {arrivals?.sort((a, b) => a.stopTime.getTime() - b.stopTime.getTime()).map((a,i) => {
      const style = i === 0 ? 'font-bold' : 'italic';
      return <div key={a.id}>
        {
          areArraysSimilar(a.trip.trips, vehicle.tripInfo?.trips) ? <div><span className={style}>This trip</span> <RouteChip route={{ code: a.trip.routeCode, id: a.trip.routeId }} inline/> {a.trip.headsign}</div> : 
          areArraysSimilar(a.trip.trips, blocks?.next?.trips) ? <div><span className={style}>Next trip</span> <RouteChip route={{ code: a.trip.routeCode, id: a.trip.routeId }} inline/> {a.trip.headsign}</div> : 
          <div><span className={style}>As</span> <RouteChip route={{ code: a.trip.routeCode, id: a.trip.routeId }} inline/> {a.trip.headsign}</div>
        }
        <div className="font-bold text-center">{`${a.departing ? "Departing" : "Arriving"} ${arrivalString(a.stopTime)}`}</div>
        <div className="italic text-center">{quantifyMiles(a.distance / 1603.344)} away from stop</div><br/>
      </div>;
    })}
    {schedule}
    {blocks && <>{
        blocks.next && (vehicleNow > blocks.end || (vehicle.adherence >= 0 && vehicleNow > blocks.end)) && vehicleNow < blocks.next.firstArrives ? <>,
          On layover until {HSTify(new Date((blocks.next.firstArrives + HST_UTC_OFFSET) * 1000), true)}<br/>
          {nextTrip}
        </> :
        blocks.next && vehicleNow > blocks.end && vehicleNow >= blocks.next.firstArrives && vehicleNow <= blocks.next.firstArrives ? <>, 
          Driver may skip layover<br/>
          {nextTrip}
        </> :
        blocks.next && vehicleNow >= blocks.next.firstArrives ? <>, 
          Next trip is starting.<br/>
          {nextTrip}
        </> :
        vehicleNow > blocks.end ? <>, 
          Ended last trip; heading back to bus facility
        </> : <>
        {!blocks.next ? <>, Last trip for bus.</> : null}
        {vehicle.nextStop ? <div><b>NEXT STOP:</b> {vehicle.nextStop.stop.code} - {vehicle.nextStop.stop.name}</div> : null}
      </>
    }</>}
    <hr className="my-2"/>
    <div className="flex gap-x-2 w-fit mx-auto">
      {vehicle.tripInfo?.trips ? <span>Trip {vehicle.tripInfo.trips.join(', ')}</span> : ''}
      {vehicle.block ? <span>Block {vehicle.block.name.split('-')[1]}</span> : ''}
      {vehicle.driver ? <span>Driver {vehicle.driver}</span> : <i>Unknown driver</i>}
    </div>
    {vehicle.last_message ? <div className="text-center italic pr-1">LAST UPDATED {HSTify(vehicle.last_message, !vehiclePage)}</div> : ''}
  </>
}
