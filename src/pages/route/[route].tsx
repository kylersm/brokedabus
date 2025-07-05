import type { GetStaticProps, NextPage } from "next";
import RouteChip from "~/components/Route";
import PadPage from "~/components/templates/PadPage";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import SuperJSON from "superjson";
import { TRPCError } from "@trpc/server";
import { api } from "~/utils/api";
import ListItem from "~/components/ListItem";
import Vehicles, { defaultVehicleFilters } from "~/components/Vehicles";
import type { PolishedHEARoute } from "~/lib/types";
import Link from "next/link";
import NotFound from "~/components/NotFound";
import HeadTitle from "~/components/HeadTitle";
import Spinner from "~/components/Spinner";
import HalfTable from "~/components/HalfTable";

const GetListOfShapes = (routes: PolishedHEARoute[]) => routes.map(r => <ListItem 
  key={r.shapeID}
  href={{
    pathname: "/shape/[shape]",
    query: { shape: r.shapeID }
  }}
  topArrow
>
  <b>{r.headsign}</b> <i>(From stop {r.firstStopCode})</i><br/>
  <i className="pl-3">Starts from {r.firstStopName}</i>
</ListItem>);

const RoutePage: NextPage<{route: string;}> = ({ route }) => {

  const isSkylineRoute = route.toLowerCase() === "sky";
  const { data: routeInfo, isError } = isSkylineRoute ?
    api.gtfs.getRouteWithShapesByID.useQuery({ routeId: "181" }) :
    api.gtfs.getRouteWithShapesByCode.useQuery({ routeCode: route });

  const { data: heaVehicles } = api.hea.getVehiclesTO.useQuery({ route }, {
    refetchInterval: 15000
  });

  if(isError) return <>
    <HeadTitle>Unknown Route</HeadTitle>
    <NotFound errorMessage="Route doesn't exist">
      <i>Given route code: <pre className='inline'>{route}</pre></i>
    </NotFound>
  </>

  if(!routeInfo) return <>
    <HeadTitle>{`Loading Route ${route}`}</HeadTitle>
    <Spinner center/>
  </>;

  const westbound = routeInfo.routes.filter(r => r.direction === 0);
  const eastbound = routeInfo.routes.filter(r => r.direction !== 0);

  return <PadPage center>
    <HeadTitle>{`Route ${routeInfo.routeCode} - ${routeInfo.gtfsInfo.name}`}</HeadTitle>
    <div className='sticky w-full top-0 pt-3 bg-white -mt-4'>
      <div className="font-bold text-2xl">
        Route <RouteChip route={{ code: routeInfo.routeCode, id: routeInfo.routeID }} inline/> {routeInfo.gtfsInfo?.name} Information
      </div>
      <div className="font-bold text-xl">
        {routeInfo.routes.length} subroute{routeInfo.routes.length !== 1 && 's'}
      </div>
      <hr className='mt-2'/>
    </div>

    <div className="inline-block md:flex mx-auto md:w-fit mt-3">
      <HalfTable caption={<>Westbound</>}>
        {GetListOfShapes(westbound)}
      </HalfTable>
      <HalfTable caption={<>Eastbound</>}>
        {GetListOfShapes(eastbound)}
      </HalfTable>
    </div>

    {isSkylineRoute ? <div className="font-bold text-xl italic mb-3">Skyline trains do not have GPS.</div> :<>
        <div className="font-bold text-xl mb-3">
          Current Vehicles<br/>
          <Link className="text-base underline text-blue-500"
            href={{
              pathname: "/route/[route]/map",
              query: { route: routeInfo.routeCode }
          }}>View map</Link>
        </div>
      <Vehicles filters={{
        ...defaultVehicleFilters,
      }} vehicles={heaVehicles}/>
    </>}
  </PadPage>;
}

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: SuperJSON
  });

  const route = context.params?.route;
  if(typeof route !== "string" || !route.length) throw new TRPCError({ code: "NOT_FOUND" });
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

export default RoutePage;