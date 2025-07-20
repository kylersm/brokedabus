import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { TRPCError } from '@trpc/server';
import ListItem from '~/components/ListItem';
import StopTitle from '~/components/StopTitle';
import ListTrips from '~/components/ListTrips';
import { addFavoriteStop, type FavoriteStop, getFavoriteStops, removeFavoriteStop } from '~/lib/prefs';
import { useEffect, useState } from 'react';
import NotFound from '~/components/NotFound';
import Spinner from '~/components/Spinner';
import HeadTitle from '~/components/HeadTitle';
import PadPage from '~/components/templates/PadPage';
import { api } from '~/utils/api';
import Button, { Color } from '~/components/Button';
import GenericTable from '~/components/GenericTable';

// List all vehicles approaching a stop
const StopIntermediary: NextPage<{stop:string}> = ({ stop }) => {
  const { data: routesServed, isError } = api.gtfs.getStopWithHeadsigns.useQuery({ code: stop });
  const [favoriteInfo, setFI] = useState<FavoriteStop>();

  useEffect(() => {
    setFI(getFavoriteStops().find(s => s.stop === stop))
  }, [stop]);

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

  return (<PadPage>
    <HeadTitle>
      {`Stop ${stop} - ${routesServed.info.name}`}
    </HeadTitle>
    <div className='mx-auto text-center'>
      <StopTitle stop={routesServed.info}/>
      {favoriteInfo?.name !== undefined && <div className='text-orange-500 font-bold text-xl'>{favoriteInfo.name}</div>}
      
      <div className='w-fit mx-auto mt-4'>
        <ListTrips trips={routesServed.trips} allowCompression compress={routesServed.trips.length > 4}/>
      </div>
      
      <Button onClick={() => {
        if(favoriteInfo) {
          if(confirm("Are you sure you want to remove this stop from your favorites?")) {
            removeFavoriteStop(stop);
            setFI(undefined);
          }
        } else {
          addFavoriteStop(stop);
          setFI({ stop });
        }
      }} color={favoriteInfo ? Color.RED : Color.GRAY}>
        {favoriteInfo ? "Remove from" : "Add to"} favorites
      </Button>

      <GenericTable>
        <ListItem
          emoji='🗺️'
          href={{
            pathname: "/stop/[stop]/rta",
            query: { stop }
          }}
        >
          <b>See realtime arrivals</b><br/>
          Track down a bus and when it will arrive
        </ListItem>
        <ListItem
          emoji='🗓️'
          href={{
            pathname: "/stop/[stop]/calendar",
            query: { stop }
          }}
        >
          <b>See scheduled arrivals</b><br/>
          See when busses will come on a specific day
        </ListItem>
        <ListItem
          emoji='📡'
          href={{
            pathname: "/stop/[stop]/map",
            query: { stop }
          }}
        >
          <b>See realtime map</b><br/>
          See busses approaching the stop on a map
        </ListItem>
      </GenericTable>
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

export default StopIntermediary;