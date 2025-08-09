import type { Map } from "leaflet";
import dynamic from "next/dynamic";
import { useState, useEffect, useContext } from "react";
import { useMap } from "../mapIntermediate";
import StopPopup from "../popups/StopPopup";
import { api } from "~/utils/api";
import { Theme } from "~/lib/prefs";
import ThemeContext from "~/context/ThemeContext";

const distance = 1000 /* meters */;

/**
 * Shows a map of stops depending on where you click. Accessed using /search/tap
 * 
 * If you grant location permissions, a circle is immediately made near your coordinates.
 * Otherwise, you will not be nagged into granting location permissions.
 * A button is added if you want to see stops near you, which then the permission popup is shown.
 * 
 * Routes are not shown with stops on this map.
 * 
 * @returns - A leaflet map.
 */
export function TapToFindStops() {
  const Map = useMap();
  const darkTheme = useContext(ThemeContext)?.[0] === Theme.DARK;
  // workaround to prevent SSR
  const Circle = dynamic(
    async () => (await import("react-leaflet")).Circle, { ssr: false }
  );

  const [point, setPoint] = useState<[number, number]>();
  const [location, setLocation] = useState<GeolocationPosition>();

  const lat = point?.[0] ?? location?.coords.latitude;
  const lon = point?.[1] ?? location?.coords.longitude;
  const { data: stops } = api.gtfs.getStopsFromPointAndDistance.useQuery({ point: [lat??0, lon??0], distance }, {
    // fails if one of them is 0 but O‘ahu doesnt include this range lol
    enabled: !!lat && !!lon
  })

  const getAndSetLocation = async () => {
    setPoint(undefined);
    const newLoc = await new Promise<GeolocationPosition>((resolve) => {
      navigator.geolocation.getCurrentPosition(pos => resolve(pos))
    });
    setLocation(newLoc);
    setPoint([newLoc.coords.latitude, newLoc.coords.longitude]);
  }

  useEffect(() => {
    async function getLocation() {
      if((await navigator.permissions.query({ name: "geolocation" })).state !== 'granted') return;
      await getAndSetLocation();
    };
    void getLocation();
  }, []);

  const [map, setMap] = useState<Map>();
  useEffect(() => {
    if (!map) return;
    // update position
    map.on("click", (e) => {
      setPoint([e.latlng.lat, e.latlng.lng]);
    });
  }, [map]);

  return <>
    <div className="left-[calc(50%+9rem)] -translate-x-1/2 fixed flex z-10 bottom-20">
      <div className="mx-auto p-1.5 bg-white dark:bg-gray-500 rounded-xl shadow-btn">
        <div className={`py-1 px-2 map-btn h-8 overflow-hidden`} onClick={() => getAndSetLocation()}>
          {/* https://www.svgrepo.com/svg/26529/location-pin */}
          <svg fill={darkTheme ? "#fff" : "#000"} width="100%" height="100%" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
          	 viewBox="0 0 297 297" xmlSpace="preserve" className="text-base max-w-full max-h-full">
          <g>
          	<path d="M148.5,0C87.43,0,37.747,49.703,37.747,110.797c0,91.026,99.729,179.905,103.976,183.645
          		c1.936,1.705,4.356,2.559,6.777,2.559c2.421,0,4.841-0.853,6.778-2.559c4.245-3.739,103.975-92.618,103.975-183.645
          		C259.253,49.703,209.57,0,148.5,0z M148.5,272.689c-22.049-21.366-90.243-93.029-90.243-161.892
          		c0-49.784,40.483-90.287,90.243-90.287s90.243,40.503,90.243,90.287C238.743,179.659,170.549,251.322,148.5,272.689z"/>
          	<path d="M148.5,59.183c-28.273,0-51.274,23.154-51.274,51.614c0,28.461,23.001,51.614,51.274,51.614
          		c28.273,0,51.274-23.153,51.274-51.614C199.774,82.337,176.773,59.183,148.5,59.183z M148.5,141.901
          		c-16.964,0-30.765-13.953-30.765-31.104c0-17.15,13.801-31.104,30.765-31.104c16.964,0,30.765,13.953,30.765,31.104
          		C179.265,127.948,165.464,141.901,148.5,141.901z"/>
          </g>
          </svg>
        </div>
      </div>
    </div>
    <Map
      zoom={12}
      refHook={setMap}
      stops={stops ? stops.map(s => ({
        stop: s.code,
        location: [s.lat, s.lon],
        popup: <StopPopup stop={s} trips={[]} />
      })) : []}
      center={point ? point : location ? [location.coords.latitude, location.coords.longitude] : undefined}
      otherComps={point ? <Circle
        center={point}
        radius={distance}
        weight={1}
        color="#f00"
        fillColor="#f00"
        fillOpacity={0.25} /> : location ? <Circle
          center={[location.coords.latitude, location.coords.longitude]}
          radius={distance}
          weight={1}
          color="#f00"
          fillColor="#f00"
          fillOpacity={0.25} /> : <></>} />
  </>;
}
