import GenericTable from "~/components/GenericTable";
import HeadTitle from "~/components/HeadTitle";
import ListItem from "~/components/ListItem";
import PadPage from "~/components/templates/PadPage";

export default function Extras() {
  return <PadPage center>
    <HeadTitle>Extras</HeadTitle>
      <div className="font-bold text-2xl">
        Extra pages for bus enthusiasts
      </div>

      <GenericTable>
        <ListItem
          href={"/extras/anomalies"}
          emoji={'‼️'}
        >
          <b>Vehicle Anomalies</b><br/>
          See vehicles on not normally served routes
        </ListItem>
        <ListItem
          href={"/extras/headsigns"}
          emoji={'🚌'}
        >
          <b>Colored Headsigns</b><br/>
          Rough recreation of colored headsigns
        </ListItem>
        <ListItem
          href={"/extras/replay"}
          emoji={'🔁'}
        >
          <b><span className="text-red-500" title="Tool used to generate files isn't public yet">[Do not use]</span> Replay Vehicles</b><br/>
          Used to replay vehicle scraping
        </ListItem>
      </GenericTable>
  </PadPage>;
}