import { type FavoriteStop, getFavoriteStops, setFavoriteStops } from "~/lib/prefs";
import PadPage from "~/components//templates/PadPage";
import { useEffect, useState } from "react";
import Spinner from "~/components//Spinner";
import ListItem from "~/components//ListItem";
import { isRailStation } from "~/lib/util";
import ListTrips from "~/components//ListTrips";
import { api } from "~/utils/api";
import HeadTitle from "~/components//HeadTitle";
import { type TripStopAIO } from "~/lib/types";
import Button, { Color } from "~/components//Button";
import GenericTable from "~/components/GenericTable";

export default function Favorites() {

  const [editMode, setEM] = useState<boolean>();

  const [stops, _setStops] = useState<FavoriteStop[]>();
  const [heaStops, setS] = useState<TripStopAIO[]>();
  const { data: _heaStops, refetch } = api.gtfs.getStopsByCodes.useQuery({ stopCodes: stops?.map(s => s.stop) ?? [] }, {
    enabled: false
  });

  useEffect(() => {
    const favorites = getFavoriteStops();
    _setStops(favorites);
  }, [refetch]);

  useEffect(() => {
    if(!heaStops && Array.isArray(stops))
      void refetch();
  }, [stops, refetch, heaStops]);

  useEffect(() => {
    if(_heaStops !== undefined)
      setS(_heaStops);
  }, [_heaStops]);

  function setStops(stops: FavoriteStop[]) {
    _setStops(stops);
    setFavoriteStops(stops);
  }

  return <PadPage>
    <HeadTitle>Favorite Stops</HeadTitle>
    <div className="mx-auto text-center">
      <div className="font-bold text-2xl">
        Your favorite stops
      </div>
      {heaStops?.length ? <Button onClick={() => setEM(!editMode)} color={Color.GREEN}>
        {editMode ? "Finish changes" : "Edit stops"}
      </Button> : ''}
      {heaStops && stops ? heaStops.length ? <>
        <div>Showing {heaStops.length} stop{heaStops.length > 1 ? 's' : ''}</div>
          <GenericTable>
            {stops
              .map(stop => {
                const hea = heaStops.find(s => s.info.code === stop.stop);
                if(!hea) return undefined;
                return { name: stop.name, ...hea }
              })
              .filter(s => s !== undefined)
              .map((stop, index, array) => <ListItem
              key={stop.info.code}
              topArrow
              href={!editMode ? {
                pathname: "/stop/[stop]",
                query: { stop: stop.info.code }
              } : undefined}
              topEmoji
              emoji={editMode ? <>
                <div className={"rotate-180 mb-3 " + (index === 0 ? "cursor-not-allowed text-gray-500" : "cursor-pointer")}
                  title="Click to move up"
                  onClick={() => {
                    const newArray = array.map(s => ({ stop: s.info.code, name: s.name }));
                    const item = newArray.splice(index, 1);
                    newArray.splice(index - 1, 0, ...item);
                    setStops(newArray);
                  }}
                >V</div>
                <div className={(index === array.length - 1 ? "cursor-not-allowed text-gray-500" : "cursor-pointer")}
                  title="Click to move down"
                  onClick={() => {
                    const newArray = array.map(s => ({ stop: s.info.code, name: s.name }));
                    const item = newArray.splice(index, 1);
                    newArray.splice(index + 1, 0, ...item);
                    setStops(newArray);
                  }}
                >V</div>
                <div className={(index === array.length - 1 ? "cursor-not-allowed text-gray-500" : "cursor-pointer")}
                  title="Click to remove"
                  onClick={() => {
                    const newArray = array.map(s => ({ stop: s.info.code, name: s.name }));
                    newArray.splice(index, 1);
                    setStops(newArray);
                  }}
                >–</div>
              </>: undefined}
            >
              {editMode ? <input 
                onChange={(evt) => {
                  const newStops = array.map(s => {
                    if(s.info.code === stop.info.code) return { stop: s.info.code, name: evt.target.value };
                    else return { stop: s.info.code, name: s.name };
                  });
                  setStops(newStops);
                }}
                className="block w-full border-2 rounded-md px-2 text-orange-500 text-center" 
                type="text" 
                value={stop.name}
                placeholder="Change your label for this stop."
              /> : stop.name === undefined ? <></> : <div className="text-orange-500 text-xl font-bold text-center">{stop.name}</div>}
              <b>{isRailStation(stop.info.code) ? "Rail Stop" : "Stop"} {stop.info.code} - {stop.info.name}</b><br/>
              <ListTrips trips={stop.trips}/>
            </ListItem>)}
          </GenericTable>
      </> :
      <div>
        You have no favorite stops
      </div> :
      <Spinner/>}
    </div>
  </PadPage>
}