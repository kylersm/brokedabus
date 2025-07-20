import HeadTitle from "~/components//HeadTitle";
import PadPage from "~/components//templates/PadPage";
import NotFound from "~/components//NotFound";
import Spinner from "~/components//Spinner";
import ListItem from "~/components//ListItem";
import RouteChip from "~/components//Route";
import { sortRouteCodes } from "~/lib/util";
import { api } from "~/utils/api";
import GenericTable from "~/components/GenericTable";

export default function Routes() {
  const { data: routes, isError } = api.gtfs.getAllRoutes.useQuery();

  if(isError) return <NotFound errorMessage="Couldn't get routes"/>;

  return <PadPage>
    <HeadTitle>All Routes List</HeadTitle>
    <div className="mx-auto text-center">
      <div className="font-bold text-2xl">
        All Routes
      </div><br/>
      {routes ? routes.length ? 
      <GenericTable>
        {routes.sort((a, b) => sortRouteCodes(a.routeCode, b.routeCode)).map(r => <>
          <ListItem
            href={{
              pathname: "/route/[route]",
              query: { route: r.routeID === "181" ? "SKY" : r.routeCode }
            }}
            topArrow
            emoji={<RouteChip route={{ code: r.routeCode, id: r.routeID }}/>}
            topEmoji
          >
            <span className="text-xl font-bold">{r.gtfsInfo.name}</span><br/>
            <ul className="ml-4 list-disc">{r.routes.map(h => <li key={r.routeID+h.headsign}>
              {h.direction ? '->' : '<-'} {h.headsign}
            </li>)}</ul>
          </ListItem>
        </>
        )}
      </GenericTable> :
      <b>Could not find any routes</b> :
      <Spinner/>}
    </div>
  </PadPage>;
}