import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { TRPCError } from '@trpc/server';
import { StopTripArrival } from "~/components/map/intermediary/StopTripArrival";
import HeadTitle from '~/components/HeadTitle';
import NotFound from '~/components/NotFound';
import Spinner from '~/components/Spinner';
import { api } from '~/utils/api';
 
const TripVehicle: NextPage<{stop:string, trip:string}> = ({ stop, trip }) => {
  const { data: routesServed, isError } = api.gtfs.getStopWithHeadsigns.useQuery({ code: stop });

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

  return (<>
    <HeadTitle>{`Stop ${stop} Trip Map: ${routesServed.info.name}`}</HeadTitle>
    <StopTripArrival stop={routesServed} trip={trip}/>
  </>)
}

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: superjson
  });

  const stop = context.params?.stop;
  const trip = context.params?.trip;
  if(typeof stop !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  if(typeof trip !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  await ssg.gtfs.getStopWithHeadsigns.prefetch({ code: stop });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      stop,
      trip
    }
  };
};

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
};

export default TripVehicle;