import { useState } from "react";
import { escapeRegex, isRailStation, sortByContext } from "~/lib/util";
import Spinner from "~/components//Spinner";
import ListItem from "~/components//ListItem";
import ListTrips from "~/components//ListTrips";
import PadPage from "~/components//templates/PadPage";
import HeadTitle from "~/components//HeadTitle";
import { api } from "~/utils/api";
import GenericTable from "~/components/GenericTable";

export default function Street() {
  const [street, setStreet] = useState<string>();
  const [error, setError] = useState<string>();

  const { data: stops } = api.gtfs.getStopsByStreetName.useQuery({ street: street ?? "" }, {
    enabled: typeof street === "string"
  });

  return <PadPage>
    <HeadTitle>Search by Street</HeadTitle>
    <div className="mx-auto text-center">
      <div className="font-bold text-2xl">
        Search by street name
      </div><br/>
      <div className="text-left inline-block mb-4">
        { /* blue highlight on textbox gets cutoff */}
        <form className="px-2 w-fit" onSubmit={e => {
          e.preventDefault();
          const st = (e.currentTarget.street as HTMLInputElement).value;
          if(st.length === 0)
            setError("Enter a street name.");
          else if(st.length < 2)
            setError("Enter more than 1 character.");
          else if(st.length > 50)
            setError("Input too long.");
          else if(st.includes('‘'))
            setError("Stop names do not include the ‘okina character.")
          else {
            setStreet(st);
            setError(undefined);
          }
        }}>
          <input name="street" type="text" placeholder="Enter street name..."/>
          <input className="submit-btn" type="submit" value="Enter"/>
        </form>
      </div><br/>

      {!error ? street ? stops ? stops.length ? <>
        <div>Showing {stops.length} stop{stops.length > 1 ? 's' : ''}</div>
        <GenericTable>
          {stops.map(stop => ({ ...stop, info: { ...stop.info, name: stop.info.name.split(new RegExp(`(${escapeRegex(street)})`, "ig")) }}))
          .sort((a, b) => 
            a.info.name.reduce(sortByContext, 0) -
            b.info.name.reduce(sortByContext, 0)
          ).map(stop => <ListItem
            key={stop.info._id}
            topArrow
            href={{
              pathname: "/stop/[stop]",
              query: { stop: stop.info.code }
            }}
          >
            <b>{isRailStation(stop.info.code) ? "Rail Stop" : "Stop"} {stop.info.code} - {stop.info.name.map(s => 
              s.toLowerCase() === street.toLowerCase() ? <><span className="bg-yellow-300 text-red-600">{s}</span></> : s
            )}</b><br/>
            <ListTrips trips={stop.trips}/>
          </ListItem>)}
        </GenericTable>
      </> :
      // no stops
      <b>No stops found</b> :
      // loading
      <Spinner/> :
      // show nothing (user entered nothing)
      <></> :
      // if error
      <div>{error}</div>}

    </div>
  </PadPage>;
}