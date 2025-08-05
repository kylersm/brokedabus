import { useState } from "react";
import { sortString } from "~/lib/util";
import Spinner from "~/components//Spinner";
import ListItem from "~/components//ListItem";
import RouteChip from "~/components//Route";
import Link from "next/link";
import PadPage from "~/components//templates/PadPage";
import HeadTitle from "~/components//HeadTitle";
import { api } from "~/utils/api";
import GenericTable from "~/components/GenericTable";
import RemoveUnderline from "~/components/RemoveUnderline";

export default function Route() {
  const [route, setRoute] = useState<string>();
  const { data: routeInfo, isFetched } = api.gtfs.getRouteWithShapesByCode.useQuery({ routeCode: route ?? "" }, {
    enabled: !!route?.length
  })

  return <PadPage>
    <HeadTitle>Search for Route</HeadTitle>
    <div className="mx-auto text-center">
      <div className="font-bold text-2xl">
        Search by route code
      </div><br/>
      <div className="text-left inline-block mb-4">
        <form onSubmit={e => {
          e.preventDefault();
          setRoute((e.currentTarget.route as HTMLInputElement).value);
        }}>
          <input name="route" type="text" placeholder="Enter route code..."/>
          <input className="submit-btn" type="submit" value="Enter"/>
        </form>
      </div><br/>

      {typeof route === "string" ? route.length ? isFetched ? routeInfo ? <>
      <div>
        See more info on route <Link href={{
          pathname: "/route/[route]",
          query: { route: routeInfo.routeCode }
        }} className="link">
          <RemoveUnderline><RouteChip route={{ code: routeInfo.routeCode, id: routeInfo.routeID }} inline/> </RemoveUnderline><b>{routeInfo.gtfsInfo?.name}</b>
        </Link>
      </div>
      <div>
        Showing {routeInfo.routes.length} subroute{routeInfo.routes.length !== 1 && 's'}
      </div>
      <GenericTable>
        {routeInfo.routes.sort((a, b) => sortString(a.shapeID, b.shapeID)).map(route => <ListItem
          key={route.shapeID}
          href={{
            pathname: "/shape/[shape]",
            query: { shape: route.shapeID }
          }}
          emoji={<span className="md:block hidden"><RouteChip route={{ code: routeInfo.routeCode, id: routeInfo.routeID }}/></span>}
          topEmoji
        >
          <span className="md:hidden inline"><RouteChip route={{ code: routeInfo.routeCode, id: routeInfo.routeID }} inline/> </span>
            <b>{route.headsign}</b><br/>
            Starts from Stop {route.firstStopCode} - <br className="md:hidden inline"/> <span className="md:not-italic italic">{route.firstStopName}<br/>
            <i>Shape ID: {route.shapeID}</i>
          </span>
        </ListItem>)}
      </GenericTable></> :
      <b>Route not found</b> :
      <Spinner/> :
      <>Must enter a route</> :
      <></>}

    </div>
  </PadPage>;
}