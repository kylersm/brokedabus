import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { TRPCError } from '@trpc/server';

import { StopRouteBusArrivals } from "~/components/map/intermediary/StopRouteBusArrivals";
import HeadTitle from '~/components/HeadTitle';
import NotFound from '~/components/NotFound';
import Spinner from '~/components/Spinner';
import { api } from '~/utils/api';
 
// View a map of all busses (GPS available) that are approaching the bus stop.
const StopArrivals: NextPage<{stop:string}> = ({ stop }) => {
  const { data: stopInfo, isError } = api.gtfs.getStopWithHeadsigns.useQuery({ code: stop });

  // stop doesn't exist
  if(isError) return <>
    <HeadTitle>Unknown Stop</HeadTitle>
    <NotFound errorMessage="Stop doesn't exist">
      <i>Given stop: <pre className='inline'>{stop}</pre></i>
    </NotFound>
  </>

  if(!stopInfo) return <>
    <HeadTitle>{`Loading Stop ${stop}`}</HeadTitle>
    <Spinner center/>
  </>;

  return <>
    <HeadTitle>{`Stop ${stop} Map: ${stopInfo.info.name}`}</HeadTitle>
    <StopRouteBusArrivals stop={stopInfo}/>
  </>
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

export default StopArrivals;