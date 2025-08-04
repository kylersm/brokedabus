import { useState } from "react";
import { escapeRegex, sortByContext } from "~/lib/util";
import Spinner from "~/components//Spinner";
import ListItem from "~/components//ListItem";
import RouteChip from "~/components//Route";
import PadPage from "~/components//templates/PadPage";
import { api } from "~/utils/api";
import HeadTitle from "~/components//HeadTitle";
import GenericTable from "~/components/GenericTable";

export default function Headsign() {
  const [headsign, setHeadsign] = useState<string>();

  const { data: headsignRoutes, isFetched } = api.gtfs.getRoutesByHeadsign.useQuery({ headsign: headsign ?? "" }, {
    enabled: !!headsign?.length,
    retry: false
  })

  return <PadPage>
    <HeadTitle>Headsign Search</HeadTitle>
    <div className="mx-auto text-center">
      <div className="font-bold text-2xl">
        Search by headsign
      </div><br/>
      <div className="text-left inline-block mb-4">
        <form onSubmit={e => {
          e.preventDefault();
          setHeadsign((e.currentTarget.headsign as HTMLInputElement).value);
        }}>
          <input name="headsign" type="text" placeholder="Enter headsign..."/>
          <input className="submit-btn" type="submit" value="Enter"/>
        </form>
      </div><br/>

      {typeof headsign === "string" ? isFetched ? headsignRoutes?.length ? <>
      <div>Showing {headsignRoutes.length} headsign{headsignRoutes.length ? 's' : ''}</div><br/>
      <GenericTable>
        {headsignRoutes.map(h => ({ ...h, route: { ...h.route, headsign: h.route.headsign.split(new RegExp(`(${escapeRegex(headsign)})`, "gi")) } }))
        .sort((a, b) => 
          a.route.headsign.reduce(sortByContext, 0) -
          b.route.headsign.reduce(sortByContext, 0)
        ).map(route => <ListItem
          key={route.route.firstStopCode+route.route.shapeID}
          href={{
            pathname: "/shape/[shape]",
            query: { shape: route.route.shapeID }
          }}
          topEmoji
          emoji={<span className="md:block hidden"><RouteChip route={{ code: route.routeCode, id: route.routeID }}/></span>}
        >
          <span className="md:hidden inline"><RouteChip route={{ code: route.routeCode, id: route.routeID }} inline/></span> <b>{headsign.length ? route.route.headsign.map(s => 
              s.toLowerCase() === headsign.toLowerCase() ? <><span className="bg-yellow-300 text-red-600">{s}</span></> : s
            ) : route.route.headsign}</b><br/>
            Starts from Stop {route.route.firstStopCode} - <br className="md:hidden inline"/> <span className="md:not-italic italic">{route.route.firstStopName}</span><br/>
            Shape ID: <pre className="inline">{route.route.shapeID}</pre>
        </ListItem>)}
      </GenericTable></> :
      <b>Route not found</b> :
      <Spinner/> :
      <></>}

    </div>
  </PadPage>;
}