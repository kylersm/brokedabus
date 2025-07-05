import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { TRPCError } from '@trpc/server';
import { OneVehicle } from "~/components/map/intermediary/OneVehicle";

const VehicleMap: NextPage<{vehicle:string}> = ({ vehicle }) => {
  return <OneVehicle vehicle={vehicle}/>;
}

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: superjson
  });

  const vehicle = context.params?.vehicle;
  if(typeof vehicle !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  
  return {
    props: {
      trpcState: ssg.dehydrate(),
      vehicle
    }
  };
};

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
};

export default VehicleMap;