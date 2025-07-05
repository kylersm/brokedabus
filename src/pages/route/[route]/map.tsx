import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { TRPCError } from '@trpc/server';
import { BusRoutes } from "~/components/map/intermediary/BusRoutes";
import NotFound from '~/components/NotFound';
import HeadTitle from '~/components/HeadTitle';
import Spinner from '~/components/Spinner';
import { api } from '~/utils/api';

// Make map of vehicles with specific route
const RouteMap: NextPage<{route:string}> = ({ route }) => {

  const isSkylineRoute = route.toLowerCase() === "sky";
  const { data: routeInfo, isError } = isSkylineRoute ?
    api.gtfs.getRouteWithShapesByID.useQuery({ routeId: "181" }) :
    api.gtfs.getRouteWithShapesByCode.useQuery({ routeCode: route });

  if(isError) return <>
    <HeadTitle>Unknown Route</HeadTitle>
    <NotFound errorMessage="Route doesn't exist">
      <i>Given route code: <pre className='inline'>{route}</pre></i>
    </NotFound>
  </>

  if(!routeInfo) return <>
    <HeadTitle>{`Loading Route ${route} Map`}</HeadTitle>
    <Spinner center/>
  </>;

  return <>
    <HeadTitle>
      {`Route ${routeInfo.routeCode} Map: ${routeInfo.gtfsInfo.name}`}
    </HeadTitle>
    <BusRoutes route={routeInfo.gtfsInfo}/>
  </>;
}

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: superjson
  });

  const route = context.params?.route;
  if(typeof route !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  if(route.toLowerCase() === "sky")
    await ssg.gtfs.getRouteWithShapesByID.prefetch({ routeId: "181" });
  else
    await ssg.gtfs.getRouteWithShapesByCode.prefetch({ routeCode: route });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      route
    }
  };
};

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
};

export default RouteMap;