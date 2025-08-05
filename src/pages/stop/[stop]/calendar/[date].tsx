import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetStaticProps, NextPage } from "next";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { TRPCError } from "@trpc/server";
import { compareToNow, dateFromHNLString, toNiceDateString, HSTify, HST_UTC_OFFSET, sortRouteCodes } from "~/lib/util";
import StopTitle from "~/components/StopTitle";
import ListItem from "~/components/ListItem";
import Spinner from "~/components/Spinner";
import RouteChip from "~/components/Route";
import HeadTitle from "~/components/HeadTitle";
import NotFound from "~/components/NotFound";
import { useState } from "react";
import ListTrips from "~/components/ListTrips";
import Button from "~/components/Button";
import HalfTable from "~/components/HalfTable";
import PadPage from "~/components/templates/PadPage";
import { api } from "~/utils/api";
import { ContainerClass, ExpandArrowClass } from "~/components/VehicleFilterOptions";

const clocks = [
  '🕛', '🕧', 
  '🕐', '🕜', 
  '🕑', '🕝', 
  '🕒', '🕞', 
  '🕓', '🕟', 
  '🕔', '🕠', 
  '🕕', '🕡', 
  '🕖', '🕢', 
  '🕗', '🕣', 
  '🕘', '🕤', 
  '🕙', '🕥', 
  '🕚', '🕦'
];

const DateRoutes: NextPage<{stop: string; date: string;}> = ({ stop, date }) => {

  const [seePast, setSP] = useState<boolean>(false);
  const [seeAM, setSAM] = useState<boolean>(true);
  const [seePM, setSPM] = useState<boolean>(true);

  const [seeRouteFilters, setSRF] = useState<boolean>(false);
  const [routeFilters, setRF] = useState<string[]>();

  const { data: routesServed, isError } = api.gtfs.getStopWithHeadsigns.useQuery({ code: stop, date: new Date(dateFromHNLString(date)) });
  const { data: calendar, isLoading } = api.gtfs.getCalendarInfo.useQuery({ stopId: stop, date: new Date(dateFromHNLString(date)) });

  let relation: string;
  switch(compareToNow(date)) {
    // if we're one ahead of the other date
    case 1:
      relation = "yesterday: ";
      break;
    case 0:
      relation = "today: ";
      break;
    case -1:
      relation = "tomorrow: ";
      break;
    default:
      relation = "";
      break;
  }
  // stop doesn't exist
  if(isError) return <>
    <HeadTitle>Unknown Stop</HeadTitle>
    <NotFound errorMessage="Stop doesn't exist">
      <i>Given stop: <pre className='inline'>{stop}</pre></i>
    </NotFound>
  </>
  if(!routesServed || !calendar) return <>
    <HeadTitle>{`Loading Stop ${stop}`}</HeadTitle>
    <Spinner center/>
  </>;

  const calendarWithFilters = calendar
    .map(c => ({ time: c.time, trips: !routeFilters ? c.trips : c.trips.filter(t => routeFilters.includes(t.displayCode))}))
    .filter(c => c.trips.length)
    .filter(c => compareToNow(date) !== 0 || seePast || (c.time + 3 * 60) > ((((Date.now() / 1000) - HST_UTC_OFFSET) % (24 * 60 * 60))));
  const AM = calendarWithFilters.filter(c => c.time < 12 * 60 * 60);
  const PM = calendarWithFilters.filter(c => c.time >= 12 * 60 * 60);
    
  return (<PadPage center>
    <HeadTitle>{`Stop ${stop} Schedule: ${routesServed.info.name}`}</HeadTitle>
    <div className='sticky w-full top-0 pt-3 bg-[var(--background)] -mt-4'>
      <StopTitle stop={routesServed.info}/>
      <span className={routesServed.trips.length ? '' : "italic"}>
        {routesServed.trips.length ? "Arrivals" : "No arrivals found"} for {relation}{toNiceDateString(new Date(dateFromHNLString(date)))}
      </span>
      <hr className='mt-2'/>
    </div>

    <div className="text-center">
      <Button onClick={() => setSRF(!seeRouteFilters)}>
        Click to {seeRouteFilters ? "hide" : "show"} filters.
      </Button>
      {compareToNow(date) === 0 && <Button onClick={() => setSP(!seePast)}>
        Click to {seePast ? "hide" : "show"} past times.
      </Button>}
    </div>

    {seeRouteFilters && <div className={ContainerClass + ' w-fit mx-auto'}>
      <div className="text-center space-x-5 my-3">
        <span className="text-emerald-500 underline cursor-pointer mt-5" onClick={() => setRF(undefined)}>
          Select all
        </span>
        <span className="text-emerald-500 underline cursor-pointer mt-5" onClick={() => setRF([])}>
          Deselect all
        </span>
      </div>

      <div className="space-y-0.5 text-left mt-5 w-fit mx-auto">
        {routesServed.trips/* .filter((t,i,a) => a.findIndex(t2 => t2.routeId === t.routeId) === i) */.sort((a, b) => sortRouteCodes(a.routeCode, b.routeCode)).map(t => 
          <label key={"RFC"+t.displayCode} 
            className={`flex gap-2 pr-3 h-fit w-full`}
            onChange={() => setRF(rf => rf?.includes(t.displayCode) ? rf.filter(r => r !== t.displayCode) : (rf ?? []).concat(t.displayCode))}
          >
            <input type="checkbox" className="mr-2" checked={!routeFilters || routeFilters.includes(t.displayCode)}/> <RouteChip route={{ code: t.routeCode, id: t.routeId}} inline/> {t.headsign}
          </label>
        )}
      </div>
    </div>}

    {routeFilters?.length && <div>{routeFilters.length} filter{routeFilters.length > 1 ? 's' : ''} applied.</div>}

    {!isLoading ? calendar.length ? calendarWithFilters.length ? <div className={`${!((AM.length / AM.length) ^ (PM.length / PM.length) /* check to see if one or other is empty so we can center the one that isn't empty */) ? "md:flex" : ''} inline-block mt-5`}>
      {AM.length ? <HalfTable caption={
        <div onClick={() => setSAM(!seeAM)} className="cursor-pointer">
          Morning (AM) <div title={'Click to ' + (seeAM ? 'hide' : 'show') + ' morning times'} className={ExpandArrowClass + (seeAM ? '' : ' rotate-180')}>V</div>
          <br/><hr/>
        </div>
      }>
        {!seeAM ? <tr><td className="text-center italic">Times are hidden. Click arrow to re-expand.</td></tr> : AM.map(r => 
          <ListItem
            key={r.time}
            topEmoji
            emoji={<span className="text-4xl">{clocks[((Math.floor(r.time / (60 * 60)) % 12) * 2 + Math.round(r.time / 60 % 60 / 30)) % 24]}</span>}
          >
            <b className="text-xl">{HSTify(new Date((r.time + HST_UTC_OFFSET) * 1000), true)}</b><br/>
            {<ListTrips trips={r.trips} key={r.time.toString()} hideRoutes/>}
          </ListItem>)}
      </HalfTable> : <></>}

      {PM.length ? <HalfTable caption={
        <div onClick={() => setSPM(!seePM)} className="cursor-pointer">
          Afternoon (PM) & Tomorrow <div title={'Click to ' + (seeAM ? 'hide' : 'show') + ' afternoon times'} className={ExpandArrowClass + (seePM ? '' : ' rotate-180')}>V</div>
          <br/><hr/>
        </div>
      }>
        {!seePM ? <tr><td className="text-center italic">Times are hidden. Click arrow to re-expand.</td></tr> : PM.map(r => 
          <ListItem
            key={r.time}
            topEmoji
            emoji={<span className="text-4xl">{clocks[((Math.floor(r.time / (60 * 60)) % 12) * 2 + Math.round(r.time / 60 % 60 / 30)) % 24]}</span>}
          >
            <b className="text-xl">{HSTify(new Date((r.time + HST_UTC_OFFSET) * 1000), true)}</b><br/>
            {/* routeFilters?.length === 1 || */<ListTrips trips={r.trips} key={r.time.toString()} hideRoutes/>}
          </ListItem>)}
      </HalfTable> : <></>}
    </div> :
    <i>No routes are selected in filters.</i> :
    <i>No scheduled trips for this date.</i> :
    <Spinner/>}
  </PadPage>);
}

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: superjson
  });

  const stop = context.params?.stop;
  const date = context.params?.date;

  if(typeof stop !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  if(typeof date !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  if(dateFromHNLString(date) < 0) throw new TRPCError({ code: "BAD_REQUEST" });
  await ssg.gtfs.getStopWithHeadsigns.prefetch({ code: stop });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      stop,
      date
    }
  };
};

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
};

export default DateRoutes;