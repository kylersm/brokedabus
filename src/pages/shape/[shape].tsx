import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { TRPCError } from '@trpc/server';
import { DrawShapes } from "~/components//map/intermediary/DrawShapes";
import NotFound from '~/components/NotFound';
import HeadTitle from '~/components/HeadTitle';
import Spinner from '~/components/Spinner';
import { api } from '~/utils/api';
 
const ShapeMap: NextPage<{shids:string[]}> = ({ shids }) => {

  const { data: routesInfo, isError } = api.gtfs.getRoutesByShIDs.useQuery({ shids });

  // shape(s) don't exist
  if(isError) return <NotFound errorMessage={`Route path${shids.length !== 1 ? 's' : ''} doesn't exist`}>
    <HeadTitle>Unknown Shape</HeadTitle>
    <i>Given shape ID{shids.length > 1 && 's'}: <pre className='inline'>{shids.join(', ')}</pre></i>
  </NotFound>;

  if(!routesInfo) return <>
    <HeadTitle>{`Loading Shape${shids.length !== 1 ? 's' : ''}`}</HeadTitle>
    <Spinner center/>
  </>;

  return <>
    <HeadTitle>{`Shape Map: ${routesInfo.map(r => `${r.routeCode} - ${r.headsign}`).join(', ')}`}</HeadTitle>
    <DrawShapes shids={shids} routes={routesInfo}/>
  </>;
}

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: superjson
  });

  const shid = context.params?.shape;
  if(typeof shid !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  const shids = [...new Set(shid.split(","))];

  return {
    props: {
      trpcState: ssg.dehydrate(),
      shids
    }
  };
};

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
};

export default ShapeMap;