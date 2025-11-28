import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { api } from '~/utils/api';
import { TRPCError } from '@trpc/server';
import { arrivalString, sortString, HSTify, quantifyMiles } from '~/lib/util';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Spinner from '~/components/Spinner';
import ListItem from '~/components/ListItem';
import StopTitle from '~/components/StopTitle';
import RouteChip from '~/components/Route';
import ListTrips from '~/components/ListTrips';
import { type PolishedArrival, type TripVehicle, type PolishedStop } from '~/lib/types';
import NotFound from '~/components/NotFound';
import HeadTitle from '~/components/HeadTitle';
import PadPage from '~/components/templates/PadPage';
import { type FavoriteStop, getFavoriteStops } from '~/lib/prefs';
import Image from 'next/image';
import GenericTable from '~/components/GenericTable';
 
// List all vehicles approaching a stop
const StopArrivals: NextPage<{stop:string}> = ({ stop }) => {
  const [routeFilter, setRouteFilter] = useState<string>();
  const { data: routesServed, isError } = api.gtfs.getStopWithHeadsigns.useQuery({ code: stop });
  const [favoriteInfo, setFI] = useState<FavoriteStop>();

  const { data: arrivals } = api.hea.getArrivals.useQuery({ stop }, {
    refetchInterval: 7.5  * 1000
  });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setFI(getFavoriteStops().find(s => s.stop === stop))
  }, [stop]);

  // stop doesn't exist
  if(isError) return <>
    <HeadTitle>Unknown Stop</HeadTitle>
    <NotFound errorMessage="Stop doesn't exist">
      <i>Given stop: <pre className='inline'>{stop}</pre></i>
    </NotFound>
  </>
  if(!routesServed) return <>
    <HeadTitle>{`Loading Stop ${stop}`}</HeadTitle>
    <Spinner center/>
  </>;

  const deduplicatedRoutes = routesServed.trips.filter((r, i, a) => a.findIndex(rr => rr.routeCode === r.routeCode) === i).sort((a, b) => sortString(a.routeCode, b.routeCode));
  const isRailStop = parseInt(stop) >= 10000;

  return (<PadPage>
    <HeadTitle>{`Stop ${stop} Arrivals: ${routesServed.info.name}`}</HeadTitle>
    <div className='mx-auto text-center'>
      <div className='sticky w-full top-0 pt-3 bg-[var(--background)] -mt-4'>
        <StopTitle stop={routesServed.info}/>
        {favoriteInfo?.name !== undefined && <div className='text-orange-500 font-bold text-xl'>{favoriteInfo.name}</div>}
        <hr className='mt-2'/>
      </div>

      <div className='w-fit mx-auto mt-4'>
        <ListTrips trips={routesServed.trips} allowCompression compress={routesServed.trips.length > 4}/>
      </div>
      {!isRailStop &&
        <div className="break-words text-wrap">
          { // show filter by route
            deduplicatedRoutes.length > 1 && <>Filter by route:
              { /* wont center on Safari mobile */ }
              <select onChange={c => setRouteFilter(c.target.value === "allbusses" ? undefined : c.target.value)}>
                <option value={"allbusses"} defaultChecked>ALL</option>
                {deduplicatedRoutes.map(r => <option key={r.routeCode} value={r.routeCode}>{r.routeCode}</option>)}
              </select>
            </>
          }
        </div>
      }

      <div className="link mb-4">
        { // show map link
        typeof routeFilter === "string" ? 
          <Link href={{
            pathname: "/stop/[stop]/map",
            query: { stop, route: routeFilter}
          }}><span className='underline'>View map for route</span> <RouteChip route={{ code: routeFilter }} inline/></Link>
        : <Link href={{
            pathname: "/stop/[stop]/map",
            query: { stop }
          }}><span className='underline'>View map</span></Link>}
      </div>

      {arrivals ? arrivals.length ? <GenericTable>
        {arrivals
          .flatMap(a => a.arrivals.map(ar => ({ arrival: ar, vehicle: a.vehicle })))
          .filter(a => !routeFilter || a.arrival.trip.routeCode === routeFilter)
          .sort((a, b) => a.arrival.stopTime.getTime() - b.arrival.stopTime.getTime())
          .map(a => <RTAEntry key={a.arrival.id} arrival={a.arrival} vehicle={a.vehicle} stop={routesServed.info} now={now}/>)
        }
      </GenericTable> : 
      'No arrivals listed' :
      // data still being loaded
      <Spinner/>}
    </div>
  </PadPage>);
}

const MetersToMiles = 1 / 1609.344;

const RTAEntry = (props: { arrival: PolishedArrival, vehicle?: TripVehicle, stop: PolishedStop, now: number }) => {
  const { arrival, vehicle, stop, now } = props;

  // used to say that the bus comes at the time specified, e.g. 11:15 rather than quantifying the amount of time before the stop time, e.g. 1 hour 3 minutes
  const arrivalLessThanHour = (arrival.stopTime.getTime() - now) < 60 * 60 * 1000;
  // If distance to stop is < 0.5 miles
  const isAtStop = (arrival.distance * MetersToMiles) < 0.5;
  // At most 45 seconds to the stop time, used to say 'arrives/departs now' instead of 'arrives in 30 seconds'
  const isLeaving =           (arrival.stopTime.getTime() - now) <= 45 * 1000;
  // <5 minutes before the bus comes
  const isApproaching =       (arrival.stopTime.getTime() - now) < 5 * 60 * 1000;

  let imageSrc = "/arrival.png";
  let imageDesc = "Bus is coming";

  let title: React.JSX.Element | string = '';
  const leaveTimeStr = arrivalString(arrival.stopTime, !arrival.departing).toLowerCase();
  const headsign = <><RouteChip route={{ code: arrival.trip.routeCode, id: arrival.trip.routeId }} inline/> {arrival.trip.headsign}</>;
  let eventTime: string | null = `${arrival.departing ? 'Departs' : 'Arrives'} at ${HSTify(arrival.stopTime, true)}`;
  let distance: string | null = null;
  let planned: string | null = null;

  /**
   * Bus xxx arrives/departs in <time>
   * <route chip>
   * Arrives/Departs at <time>
   * <Distance to stop>
   */
  if(arrivalLessThanHour) {
    title = leaveTimeStr.toLowerCase();
    // change to orange icon; no further change needed
    imageSrc = "/arrival.png";
    imageDesc = "Bus is coming";
    if(isApproaching) {
      imageSrc = "/arriving.png";
      imageDesc = "Bus is approaching";
      /**
       * Bus xxx arrives/departs now
       * <route chip>
       * Arrives/Departs at <time>
       * <Distance to stop>
       */
      if(isLeaving) {
        title = (arrival.departing ? 'departs' : 'arrives') + ' now';
      }
    }
  } else 
  /**
   * Bus xxx was canceled 
   * <route chip>
   * Arrives/Departs at <time>
   * <Distance to stop>
   */
  if(arrival.status === "Canceled") {
    // title = <></>;
    imageSrc = "/canceled.png";
    imageDesc = "Bus was canceled";
  } else {
    /**
     * Bus xxx arrives/departs at <time>
     * <route chip>
     * <Distance to stop>
     */
    title = (arrival.departing ? 'departs' : 'arrives') + ` at ${HSTify(arrival.stopTime, true)}`
  }


  if(vehicle) {
    
    if(isAtStop)
      distance = "Already at stop";
    else
      distance = `${quantifyMiles(arrival.distance * MetersToMiles)} away`;
    title = `Bus ${vehicle.number} ${title}`;
  } else {
    title = `Scheduled bus ${title}`;
    imageSrc = "/scheduled.png";
    imageDesc = "Bus lacks GPS";
    eventTime = null;
    if(arrivalLessThanHour)
      planned = `Planned ${arrival.departing ? 'departure' : 'arrival'} for ${HSTify(arrival.stopTime, true)}`
  }

  return <ListItem
    emoji={<Image 
      className='min-w-14 max-w-14'
      src={imageSrc}
      width={100} height={100}
      title={imageDesc}
      alt={imageDesc}
    />}
    href={{
      pathname: "/stop/[stop]/map/[trip]",
      query: { stop: stop.code, trip: arrival.trip.trips[0] }
    }}
  >
    <span className={`${arrival.estimated === "GPS" ? "font-bold" : "italic"}`}>
      <p className="text-xl">
        {title} {arrival.status === "Canceled" && <span className='text-red-500 font-bold not-italic'>CANCELLED</span>}
      </p>
      {headsign}
    </span><br/>

    {eventTime && <>{eventTime}<br/></>}
    {/* distance or planned time */}
    {distance}{planned}
  </ListItem>
};

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: superjson
  });

  const stop = context.params?.stop;
  if(typeof stop !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  await ssg.gtfs.getStopWithHeadsigns.prefetch({ code: stop });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      stop
    }
  };
};

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
};

export default StopArrivals;