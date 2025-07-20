import { useState } from "react";
import { isRailStation } from "~/lib/util";
import Spinner from "~/components//Spinner";
import ListItem from "~/components//ListItem";
import ListTrips from "~/components//ListTrips";
import PadPage from "~/components//templates/PadPage";
import HeadTitle from "~/components//HeadTitle";
import { api } from "~/utils/api";
import GenericTable from "~/components/GenericTable";

export default function StopID() {
  const [stop, setStop] = useState<string>();
  const { data: stopInfo, isFetched } = api.gtfs.getStopWithHeadsigns.useQuery({ code: stop ?? "" }, {
    enabled: !!stop?.length
  });

  const isRailStop = isRailStation(stop);

  return <PadPage>
    <HeadTitle>Search by Stop Code</HeadTitle>
    <div className="mx-auto text-center">
      <div className="font-bold text-2xl">
        Search by stop number
      </div><br/>
      <div className="text-left inline-block mb-4">
        <form onSubmit={e => {
          e.preventDefault();
          setStop((e.currentTarget.stop as HTMLInputElement).value);
        }}>
          <input name="stop" className="border-2 rounded-xl px-3 mr-3" type="text" placeholder="Enter stop number..."/>
          <input className="border-2 rounded-xl px-2 bg-blue-500 text-white active:bg-blue-600" type="submit" value="Enter"/>
        </form>
      </div><br/>
      
      {stop ? isFetched ? stopInfo ? <GenericTable>
        <ListItem
          topArrow
          href={{
            pathname: "/stop/[stop]",
            query: { stop: stopInfo.info.code }
          }}
        >
          <b>Stop <span className="bg-yellow-300 text-red-600">{stopInfo.info.code}</span> - {stopInfo.info.name}</b><br/>
          { isRailStop ? <div className="mx-auto text-center italic">This is a stop for TheRail.<br/></div> : <></> }
          <ListTrips trips={stopInfo.trips}/>
        </ListItem>
      </GenericTable> :
      <b>Stop not found</b> :
      <Spinner/> :
      <></>}

    </div>
  </PadPage>;
}