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

  const arrivalLessThanHour = (arrival.stopTime.getTime() - now) < 60 * 60 * 1000;
  const isAtStop = arrival.distance ? (arrival.distance * MetersToMiles) < 0.5 : false;
  const isLeaving = ((arrival.stopTime.getTime() - now) / 1000) <= 45;

  return <ListItem
    emoji={<Image 
      className='min-w-14 max-w-14'
      src={arrival.status === "Canceled" ? "/canceled.png" : vehicle === undefined ? "/scheduled.png" : arrival.stopTime.getTime() - Date.now() < 60000 * 5 ? "/arriving.png" : "/arrival.png"}
      width={100} height={100}
      title={vehicle === undefined ? "Bus lacks GPS" : arrival.stopTime.getTime() - Date.now() < 60000 * 5 ? "Bus is approaching" : "Bus is coming"}
      alt={vehicle === undefined ? "Bus lacks GPS" : arrival.stopTime.getTime() - Date.now() < 60000 * 5 ? "Bus is approaching" : "Bus is coming"}
    />}
    href={{
      pathname: "/stop/[stop]/map/[trip]",
      query: { stop: stop.code, trip: arrival.trip.trips[0] }
    }}
  >
    <span className={`${arrival.estimated === "GPS" ? "font-bold" : "italic"}`}>
      <p className="text-xl">
        {
          arrival.status === "Canceled" ? 
            <>{vehicle === undefined ? 'Scheduled Bus' : `Bus ${vehicle.number}`} <span className='text-red-500 font-bold not-italic'>CANCELLED</span></> 
          : ((vehicle === undefined ? 
            arrivalLessThanHour ? `Scheduled Bus `/* in .. minutes */ :
            `Scheduled Bus for ${HSTify(arrival.stopTime, true)}` : 
            `Bus ${vehicle.number} `) + (isLeaving ? `is ${arrival.departing ? 'departing' : 'arriving'} now` : arrivalLessThanHour ? arrivalString(arrival.stopTime) : ''))
        }
      </p>
      <RouteChip route={{ code: arrival.trip.routeCode, id: arrival.trip.routeId }} inline/> {arrival.trip.headsign}
    </span><br/>

    {
      vehicle !== undefined ?
        <>
          {arrival.departing ? 'Departs' : 'Arrives'} at {HSTify(arrival.stopTime, true)}<br/>
          <i>{isAtStop ?  "Already at stop" : arrival.distance > 0 ? `${quantifyMiles(arrival.distance * MetersToMiles)} away` : ''}</i>
        </>
      :
        arrivalLessThanHour ? <>
          {arrival.departing ? 'Departs' : 'Arrives'} at {HSTify(arrival.stopTime, true)}
        </> : <>Planned {arrival.departing ? 'departure' : 'arrival'} {arrival.status === "Canceled" ? `for ${HSTify(arrival.stopTime, true)}` : ''}</>
    }
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