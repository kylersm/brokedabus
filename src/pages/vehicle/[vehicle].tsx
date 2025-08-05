import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from "superjson";
import type { GetStaticProps, NextPage } from 'next';
import { appRouter } from '~/server/api/root';
import { api } from '~/utils/api';
import { TRPCError } from '@trpc/server';
import RouteChip from '~/components/Route';
import Link from 'next/link';
import { getHSTTime, HST_UTC_OFFSET, HSTify, quantifyTime, quantifyTimeShortened } from '~/lib/util';
import VehiclePopup from '~/components/map/popups/VehiclePopup';
import { brightenColor, busInfoToString, getColorFromRoute, getVehicleInformation } from "~/lib/BusTypes";
import { useEffect, useState } from 'react';
import ListItem from '~/components/ListItem';
import NotFound from '~/components/NotFound';
import Button from '~/components/Button';
import { getExpectedTrip } from '~/lib/GTFSBinds';
import HeadTitle from '~/components/HeadTitle';
import PadPage from '~/components/templates/PadPage';
import GenericTable from '~/components/GenericTable';

const staleColor = '#999999';
const isArrivalFresh = (arrived: number) => arrived + 65 >= 0;

const VehicleIntermediary: NextPage<{vehicle:string}> = ({ vehicle }) => {

  const { data: vehicleInfo } = api.hea.getVehicle.useQuery({ vehicleNum: vehicle }, {
    refetchInterval: (r) => {
      if (r.state.error)
        return false;
      else return 10000;
    }
  });
  const tripInfo = getExpectedTrip(vehicleInfo?.block);
  const { data: stops } = api.gtfs.getStopsByTripID.useQuery({ tripId: tripInfo?.trips ?? [] }, {
    enabled: !!tripInfo?.trips.length
  })

  const [seePrevBlocks, setPB] = useState<boolean>(false);
  const [seePrevStops, setPS] = useState<boolean>(false);
  const [now, setNow] = useState<number>((getHSTTime() + (60 * (vehicleInfo?.adherence ?? 0))) % (24 * 60 * 60));

  useEffect(() => {
    const interval = setInterval(() => setNow((getHSTTime() + (60 * (vehicleInfo?.adherence ?? 0))) % (24 * 60 * 60)), 1000);
    return () => clearInterval(interval);
  }, [vehicleInfo]);

  // stop doesn't exist
  if(!vehicleInfo) return <NotFound errorMessage="Vehicle doesn't exist">
    <HeadTitle>Unknown Vehicle</HeadTitle>
    <i>Given vehicle: <pre className='inline'>{vehicle}</pre></i>
  </NotFound>;
  
  const vehicleModelInfo = getVehicleInformation(vehicleInfo.number);

  const difference = stops?.some(s => (s.trip.arrives - now) > (12 * 60 * 60)) ? 24 * 60 * 60 : 0;
  const color = getColorFromRoute({ code: vehicleInfo.block?.trips.find(t => t.trips.includes(vehicleInfo.trip ?? ''))?.routeCode ?? '' });
  const brightened = brightenColor(color);

  return (<PadPage center>
    <HeadTitle>
      {`Bus ${vehicleInfo.number}`}
    </HeadTitle>
    { /* header and other info */ }
    <div className='w-fit mx-auto'>
      <b className='text-3xl'>Bus {vehicleInfo.number}</b><br/>
      { tripInfo ?
      <b className='text-xl'><RouteChip route={{ code: tripInfo.routeCode }} inline/> {tripInfo.headsign}<br/></b> :
      <i>No route assigned, </i>}
      <VehiclePopup 
        vehicle={{ ...vehicleInfo, tripInfo }}
        vehiclePage
      />
    </div>

    {vehicleModelInfo && <div className='w-fit mx-auto'>
      <b className='mt-5 mb-2 block text-2xl'>Model Info</b>
      {busInfoToString(vehicleModelInfo)}<br/>
      <ul className='text-left list-disc pl-5 w-fit'>
        <li>Has {vehicleModelInfo.windowType} {vehicleModelInfo.windowColor} Windows</li>
        <li>Using a {vehicleModelInfo.headsignColor} headsign</li>
        {vehicleModelInfo.leftHeadsign && <li>Has left headsign</li>}
      </ul>
    </div>}

    <b className='mt-5 mb-2 block text-2xl'>Map Info</b>
    <div className='flex gap-5 mx-auto w-fit'>
      <Link className='link' href={{
        pathname: "/vehicle/[vehicle]/map",
        query: { vehicle: vehicleInfo.number }
      }}>See live map</Link>
      <Link className={`link ${tripInfo ? "inline-block" : "hidden"}`} href={{
        pathname: "/shape/[shape]",
        query: { shape: tripInfo?.shapeId }
      }}>See subroute <RouteChip route={{ code: tripInfo?.routeCode ?? "" }} inline/> stops</Link>
      <Link className={`link ${tripInfo ? "inline-block" : "hidden"}`} href={{
        pathname: "/route/[route]",
        query: { route: tripInfo?.routeCode }
      }}>See route <RouteChip route={{ code: tripInfo?.routeCode ?? "" }} inline/> info</Link>
    </div>

    {vehicleInfo && stops && <>
      <b className='mt-5 mb-2 block text-2xl'>Stop Sequence</b>
      <Button onClick={() => setPS(!seePrevStops)}>
        {seePrevStops ? "Hide" : "Show"} previous stops
      </Button>
      <div className='flex w-full'>
        <ol className="overflow-hidden space-y-8 mb-10 text-left mx-auto">
          {stops
            .map(s => {
              const arrives = (s.trip.arrives - now) - difference;
              return { 
                ...s,
                trip: { ...s.trip, arrives },
                color: !isArrivalFresh(arrives) ? staleColor : arrives < 0 ? color : brightened 
              };
            })
            .filter((s, i) => seePrevStops || i === stops.length - 1 || isArrivalFresh(s.trip.arrives))
            .map((s, i, a) => {
              const arrives = s.trip.arrives;
              return <li key={s.trip.sequence} className="relative flex-1">
                <div className='flex items-start font-medium'>
                  { /* the circle */ }
                  <span 
                    style={{ backgroundColor: s.color }}
                    className='min-w-12 w-12 h-12 rounded-full flex justify-self-start mr-3 text-sm'
                  />
                  { /* the line */ }
                  {i !== a.length - 1 && <div 
                    style={{ 
                      background: `linear-gradient(${s.color}, ${a[i+1]!.color})`
                    }}
                    className={`w-1.5 h-[calc(100%-0.75rem)] inline-block absolute top-[calc(2.85rem)] left-[calc((3rem-0.375rem)/2)] z-40`}
                  />}
                  { /* stop text */ }
                  <div>
                    <div className="text-lg font-semibold h-full w-fit md:w-[35rem]">
                      <Link className='link' href={{
                          pathname: "/stop/[stop]/rta",
                          query: { stop: s.stop.code }
                      }}><span className='font-bold text-xl md:text-lg'>Stop {s.stop.code}</span> <span className='hidden md:inline'>-</span>
                        <br className='block md:hidden'/> {s.stop.name}
                      </Link>
                    </div>
                    <div className="text-lg">
                      {arrives > 0 && <>({HSTify(new Date((now + HST_UTC_OFFSET + arrives - vehicleInfo.adherence * 60) * 1000), true)})<br/></>}
                      <i>{arrives < 0 ? `Arrival was ${quantifyTime(Math.abs(arrives))} ago` : arrives > 0 ? `Arrives in ${quantifyTime(Math.abs(arrives))}` : "Now"}</i>
                    </div>
                  </div>
                </div>
              </li>
            })
          }
        </ol>
      </div>
    </>}

    {vehicleInfo?.block && <>
      <b className='mt-5 block text-2xl'>Block Info ({quantifyTime(Math.max(...vehicleInfo.block.trips.map(i=>i.lastDeparts)) - Math.min(...vehicleInfo.block.trips.map(i=>i.firstArrives)))})</b>
      <Button onClick={() => setPB(!seePrevBlocks)}>
        {seePrevBlocks ? "Hide" : "Show"} previous trips
      </Button>
      <GenericTable>
        {vehicleInfo.block.trips.filter((_, i, a) => seePrevBlocks || a.findIndex(b3 => b3.trips === tripInfo?.trips) <= i).map((b, i, a) => <ListItem 
          emoji={<RouteChip route={{ code: b.routeCode, id: b.routeId }}/>}
          topEmoji
          href={{
            pathname: "/shape/[shape]/",
            query: { shape: b.shapeId }
          }}
          key={b.trips.join(',')}
        >{(() => {
          const isPrevious = a.findIndex(b3 => b3.trips === tripInfo?.trips) > i;
          return <div>
            <p className={isPrevious ? 'italic' : 'font-bold'}>{b.headsign} ({quantifyTimeShortened(b.lastDeparts - b.firstArrives)})</p>
            <i>{tripInfo?.trips === b.trips ? 'CURRENT TRIP' : isPrevious ? 'Previous trip' : 'Future trip'}
            </i>{(() => {
              const nextArrives = a[i+1]?.firstArrives;
              if(nextArrives === undefined || (nextArrives - b.lastDeparts) < 1) return <></>;
              else return  <>
              , then layover for {quantifyTime(nextArrives - b.lastDeparts)}
            </>})()}
            <br/>
            Trip {b.trips.join(', ')} | {HSTify(new Date((b.firstArrives + HST_UTC_OFFSET) * 1000), true)} - {HSTify(new Date((b.lastDeparts + HST_UTC_OFFSET) * 1000), true)}<br/>
          </div>
        })()}</ListItem>)}
      </GenericTable>
      <div className='italic mb-14'>~End of block~</div>
    </>}
  </PadPage>);
}

export const getStaticProps:GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {},
    transformer: superjson
  });

  const vehicle = context.params?.vehicle;
  if(typeof vehicle !== "string") throw new TRPCError({ code: "NOT_FOUND" });
  await ssg.hea.getVehicle.prefetch({ vehicleNum: vehicle });

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

export default VehicleIntermediary;