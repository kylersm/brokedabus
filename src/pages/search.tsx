import HeadTitle from "~/components//HeadTitle";
import ListItem from "~/components//ListItem";
import PadPage from "~/components//templates/PadPage";
import GenericTable from "~/components/GenericTable";

export default function Search() {
  return <PadPage center>
    <HeadTitle>Search Methods</HeadTitle>
    <div className="font-bold text-2xl">
      How do you want to search for stops?
    </div>
    <GenericTable>
      <ListItem
        href={"/search/stop"}
        emoji={'🚏'}
      >
        <b>Enter the stop number</b><br/>
        You must know the exact stop number
      </ListItem>
      <ListItem
        href={"/search/street"}
        emoji={'🛣️'}
      >
        <b>Search by street name</b><br/>
        See stops on a specific street
      </ListItem>
      <ListItem
        href={"/search/route"}
        emoji={'🚍'}
      >
        <b>Enter a route</b><br/>
        See trips served by a route
      </ListItem>
      <ListItem
        href={"/search/headsign"}
        emoji={'🏞️'}
      >
        <b>Search by headsign</b><br/>
        Search trips using a destination
      </ListItem>
      <ListItem
        href={"/search/tap"}
        emoji={'🗺️'}
      >
        <b>Tap to find stops</b><br/>
        Use and tap a map to find stops in a radius
      </ListItem>
      <ListItem
        href={"/routes"}
        emoji={'📋'}
      >
        <b>View all routes</b><br/>
        A list of routes and their headsigns
      </ListItem>
    </GenericTable>
  </PadPage>;
}