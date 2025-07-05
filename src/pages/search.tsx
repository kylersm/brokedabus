import HeadTitle from "~/components//HeadTitle";
import ListItem from "~/components//ListItem";
import PadPage from "~/components//templates/PadPage";

export default function Search() {
  return <PadPage center>
    <HeadTitle>Search Methods</HeadTitle>
    <div className="font-bold text-2xl">
      How do you want to search for stops?
    </div>
    <table className="text-left mx-auto border-spacing-y-5 border-separate px-4 table-fixed">
      <tbody>
        <ListItem
          href={"/search/stop"}
          emoji={'🚏'}
        >
          <b>Enter the stop number</b><br/>
          You must know the exact stop number.
        </ListItem>
        <ListItem
          href={"/search/street"}
          emoji={'🛣️'}
        >
          <b>Search by street name</b><br/>
          Great if you {"can't"} find an exact stop number.
        </ListItem>
        <ListItem
          href={"/search/route"}
          emoji={'🚍'}
        >
          <b>Enter a route</b><br/>
          You should know the short name
        </ListItem>
        <ListItem
          href={"/search/headsign"}
          emoji={'🏞️'}
        >
          <b>Search by headsign</b><br/>
          You should know the destination of the route
        </ListItem>
        <ListItem
          href={"/search/tap"}
          emoji={'🗺️'}
        >
          <b>Tap to find stops</b><br/>
          Use a visual map and tap!
        </ListItem>
        <ListItem
          href={"/routes"}
          emoji={'📋'}
        >
          <b>View all routes</b><br/>
          A list of routes and their headsigns
        </ListItem>
      </tbody>
    </table>
  </PadPage>;
}