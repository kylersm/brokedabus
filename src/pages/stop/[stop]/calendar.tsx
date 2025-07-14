import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetStaticProps, NextPage } from "next";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { TRPCError } from "@trpc/server";
import { getHNLSafeDateString, sortRouteCodes, toNiceDateString } from "~/lib/util";
import Spinner from "~/components/Spinner";
import StopTitle from "~/components/StopTitle";
import ListItem from "~/components/ListItem";
import { useEffect, useMemo, useState } from "react";
import HeadTitle from "~/components/HeadTitle";
import NotFound from "~/components/NotFound";
import RouteChip from "~/components/Route";
import PadPage from "~/components/templates/PadPage";
import { api } from "~/utils/api";
import Button from "~/components/Button";
import { type FavoriteStop, getFavoriteStops } from "~/lib/prefs";
import Image from "next/image";

const dotw = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

const Calendar: NextPage<{stop:string}> = ({ stop }) => {
  const { data: routesServed, isError } = api.gtfs.getStopWithHeadsigns.useQuery({ code: stop });
  const [favoriteInfo, setFI] = useState<FavoriteStop>();

  useEffect(() => {
    setFI(getFavoriteStops().find(s => s.stop === stop))
  }, [stop]);

  const [beforeToday, setBT] = useState<boolean>(false);
  const today = useMemo(() => {
    const date = new Date();
    date.setUTCHours(date.getUTCHours() - 10, 0, 0, 0);
    date.setUTCHours(0);
    return date;
  }, []);
  
  const { data: calendar, isLoading } = api.gtfs.getCalendarOverview.useQuery({ stopId: routesServed?.info._id ?? "" }, {
    enabled: routesServed !== undefined
  });

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

  return (<PadPage center>
    <HeadTitle>{`Stop ${stop} Calendar: ${routesServed.info.name}`}</HeadTitle>
    <div className='sticky w-full top-0 pt-3 bg-white -mt-4'>
      <StopTitle stop={routesServed.info}/>
      {favoriteInfo?.name !== undefined && <div className='text-orange-500 font-bold text-xl'>{favoriteInfo.name}</div>}
      <hr className='mt-2'/>
    </div>
    
    <Button onClick={() => setBT(b => !b)}>
      {beforeToday ? "Hide" : "Show"} dates before today
    </Button>
    <div className="flex justify-center">
    {!isLoading ? calendar ? <table className="w-full md:w-auto border-spacing-y-1 ml-4">
      <tbody>
        {Object.entries(calendar).filter(([d]) => beforeToday || (parseInt(d) >= today.getTime())).map(([k, ci]) => {
          const date = new Date(parseInt(k));
          return <ListItem key={"D"+k}
            topEmoji
            emoji={<Image src={`/dotw/${dotw[date.getUTCDay()]}.png`} className="min-w-10 max-w-14" alt={dotw[date.getUTCDay()] ?? ''} width={150} height={150}/>}
            href={{
              pathname: "/stop/[stop]/calendar/[date]",
              query: { stop, date: getHNLSafeDateString(date) }
            }}
          >
            <div className="w-fit text-left">
              <p className="text-lg font-semibold">{toNiceDateString(date)}{parseInt(k) < today.getTime() && " (Passed)"}</p>
              <div>{ci.length ? 
                ci.sort((a, b) => sortRouteCodes(a.code, b.code)).map(c => <span key={c.id+c.code} className="pr-2 whitespace-nowrap inline-block"><RouteChip inline route={c}/></span>)
              : <i>No trips planned</i>}</div>
            </div>
          </ListItem>
        })}
      </tbody>
    </table> : <i>Could not find routes for stop for this time</i>
    : <Spinner/>}
    </div>
  </PadPage>);
}

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

export default Calendar;