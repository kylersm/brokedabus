import HeadTitle from "~/components//HeadTitle";
import PadPage from "~/components//templates/PadPage";
import NotFound from "~/components//NotFound";
import Spinner from "~/components//Spinner";
import ListItem from "~/components//ListItem";
import RouteChip from "~/components//Route";
import { escapeRegex, sortRouteCodes } from "~/lib/util";
import { api } from "~/utils/api";
import GenericTable from "~/components/GenericTable";
import { useState } from "react";

export default function Routes() {
  const { data: routes, isError } = api.gtfs.getAllRoutes.useQuery();

  const [query, setQuery] = useState<string>();

  if(isError) return <NotFound errorMessage="Couldn't get routes"/>;

  return <PadPage>
    <HeadTitle>All Routes List</HeadTitle>
    <div className="mx-auto text-center">
      <div className="font-bold text-2xl">
        All Routes
      </div><br/>
      <div className="text-left inline-block mb-4">
        <form onSubmit={e => {
          e.preventDefault();
          setQuery((e.currentTarget.query as HTMLInputElement).value);
        }}>
          <input name="query" type="text" placeholder="Search routes using a code, name or headsign..."/>
          <input className="submit-btn" type="submit" value="Enter"/>
        </form>
      </div><br/>
      {routes ? routes.length ? 
      <GenericTable>
        {routes
          .sort((a, b) => sortRouteCodes(a.routeCode, b.routeCode))
          .filter(r => 
            !query?.length || 
            r.routeCode.toLowerCase() === query.toLowerCase() ||
            r.gtfsInfo.name.toLowerCase().includes(query.toLowerCase()) ||
            r.routes.some(t => t.headsign.toLowerCase().includes(query.toLowerCase()))
          )
          .map(r => ({
            ...r,
            splitRouteCode: r.routeCode.toLowerCase() === query?.toLowerCase() ? ['', '']: [r.routeCode],
            splitRouteName: query ? r.gtfsInfo.name.split(new RegExp(`(${escapeRegex(query)})`, "gi")) : [r.gtfsInfo.name],
            routes: r.routes.map(t => ({
              ...t, 
              splitHeadsign: query ? t.headsign.split(new RegExp(`(${escapeRegex(query)})`, "gi")) : [t.headsign],
            }))
          }))
          .sort((a, b) => query ?
            (2 * b.splitRouteCode.length + b.splitRouteName.length + b.routes.reduce((p, r) => p + r.splitHeadsign.length, 0)) -
            (2 * a.splitRouteCode.length + a.splitRouteName.length + a.routes.reduce((p, r) => p + r.splitHeadsign.length, 0))
          : 0)
          .map(r => <>
          <ListItem
            href={{
              pathname: "/route/[route]",
              query: { route: r.routeID === "181" ? "SKY" : r.routeCode }
            }}
            topArrow
            emoji={<RouteChip 
              color={
                (query && r.routeCode.toLowerCase() === query.toLowerCase()) || 
                ['A', 'U', 'W'].some(C => r.routeCode === `${C} LINE` && [`${C} LINE`, C].includes(query?.toUpperCase() ?? '')) ||
                (r.routeID === '181' && ['skyline', 'sky'].includes(query?.toLowerCase() ?? ''))
              ? {
                bg: "bg-amber-300",
                text: "text-red-600",
              } : undefined}
              route={{ 
                code: r.routeCode,
                id: r.routeID,
              }}/>}
            topEmoji
          >
            <span className="text-xl font-bold">
              {r.splitRouteName.map(n => n.toLowerCase() === query?.toLowerCase()
                ? <><span className="bg-yellow-300 text-red-600">{n}</span></>
                : n
              )}
            </span><br/>
            <ul className="ml-4 list-disc">{r.routes.map(h => <li key={r.routeID+h.headsign}>
              {h.direction ? '->' : '<-'} {h.splitHeadsign.map(n => n.toLowerCase() === query?.toLowerCase()
                ? <><span className="bg-yellow-300 text-red-600">{n}</span></>
                : n
              )}
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