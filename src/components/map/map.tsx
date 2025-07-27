"use client";

import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, Marker, TileLayer, Popup, ZoomControl } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { PolishedArrival, PostRqVehicle } from "~/lib/types";
import type { PolishedShapeContainer } from "~/lib/GTFSTypes";
import { brightenColor, getColorFromRoute, getContrastFromRoute } from "~/lib/BusTypes";
import VehiclePopup from './popups/VehiclePopup';

import SmoothWheelZoom from "~/components/map/hooks/SmoothWheelZoom";
import PolylineDecorator from "~/components/map/hooks/PolylineDecorator";

const activeMapBtn = "bg-slate-200 rounded-md shadow-sm";

export interface SuperficialVehicle extends PostRqVehicle {
  arrivalInfo?: PolishedArrival;
}

export interface TrackableSuperficialVehicle extends SuperficialVehicle {
  lastUpdated: number;
  evtAdd: () => void;
  evtRem: () => void;
}

export interface SuperficialStop {
  // this should be the stop itself
  stop: string;
  popup: JSX.Element;
  location: LatLngExpression;
  stale?: boolean;
}

export interface SuperficialShape {
  direction: 'East' | 'West';
  routePath: PolishedShapeContainer;
  unfocused?: boolean;
}

/**
 * The map :)
 * 
 * @param props - See below for details
 * @returns - A leaflet map.
 */
export default function Map(props: { 
  // list of vehicles to display on map
  vehicles?: SuperficialVehicle[];
  // list of shapes to display on map
  routePath?: SuperficialShape[];
  // list of stops to display on map
  stops?: SuperficialStop[];
  // header element / text to show on map (the white banner)
  header?: JSX.Element;

  // zoom of map on load
  zoom?: number;
  // where the center of the map should be
  center?: LatLngExpression;
  // whether or not a trip arrival has no vehicle attached to it.
  noGPS?: boolean;
  // when map updates, leaflet snaps view to open bus popups
  followBus?: boolean;
  // used when looking at arrivals, when busses usually fly in and out of the API (thus leaving a trail of static bus markers to wipe)
  // if TRUE, remove a vehicle from cache if it hasn't appeared in the input array for 2 minutes
  // if it is a FUNCTION, check the condition above AND against the predicate function. if it passes the predicate, it is removed
  wipeBus?: true | ((v: SuperficialVehicle) => boolean);

  // do magic here (get map from parent element to do things)
  refHook?: Dispatch<SetStateAction<L.Map | undefined>>;
  // get a list of open vehicle popups in the parent element
  vehicleHook?: Dispatch<SetStateAction<string[]>>;
  // other elements we might want to show (only occurrence is the tap for stops circle)
  otherComps?: JSX.Element[] | JSX.Element
}) {
  const { vehicles, routePath, stops, header, zoom, center, noGPS, wipeBus, followBus, refHook, vehicleHook, otherComps } = props;

  // keeps track of open vehicle popups so we can dynamically show the user relevant shapes / stops.
  const openVehicles = useMemo(() => new Set<string>(), []);
  const [isMapSet, setIMS] = useState<boolean>();
  // ^v these two do sorta the same thing with different ways for different reasons.
  // openTrips keeps track of which vehicles' popups are open
  // vehicleCache keeps track of every vehicle marker to update it's position

  // keeps track of open vehicle popups without the need for leaflet events by tricking react into not rerendering everything
  const vehicleCache = useRef<Record<string, TrackableSuperficialVehicle>>({});

  useMemo(() => {
    const AC = new AbortController();
    const sig = AC.signal;
    const getVC = async () => {
      if(Array.isArray(vehicles)) {
        const now = Date.now();
        if(wipeBus !== undefined) {
          for(const [key, value] of Object.entries<TrackableSuperficialVehicle>(vehicleCache.current)) {
            // when wiping, remove if a relevant vehicle wasn't seen in the past 2 minutes, or if it passes the predicate function (if provided)
            const foundVehicle = vehicles.find(v => v.number === key);
            if(!foundVehicle) {
              if(wipeBus !== true || (now - value.lastUpdated) > (2 * 60 * 1000))
                delete vehicleCache.current[key];
            } else if(wipeBus !== true && wipeBus(foundVehicle))
              delete vehicleCache.current[key];
          }
        }

        for(const vehicle of vehicles) {
          if(sig.aborted) return;
          vehicleCache.current[vehicle.number] = { 
            ...vehicle,
            lastUpdated: now,
            evtAdd: () => {
              if(!vehicleHook || openVehicles === undefined) return;
              openVehicles.add(vehicle.number);
              vehicleHook([...openVehicles]);
            },
            evtRem: () => {
              if(!vehicleHook || openVehicles === undefined) return;
              openVehicles.delete(vehicle.number);
              vehicleHook([...openVehicles]);
            }
          };
        }
      }
    }
    void getVC();
    return () => AC.abort();
  }, [vehicles, openVehicles, vehicleHook, wipeBus]);

  // changes map terrain images
  const [mapMode, setMapMode] = useState<0|1|2>(0);
  // used to appropriately resize vehicle icons
  const [zoomLvl, setZoom] = useState<number>(zoom ?? 11);

  return (<div className="w-auto flex-col flex overflow-hidden">
    {header && <div className='text-center font-semibold fixed mt-2.5 py-5 z-10 bg-white bg-opacity-75 w-full text-black'>
      <div className='w-full'>{header}</div>
    </div>}
    <div className="left-1/2 -translate-x-1/2 fixed flex z-10 bottom-20">
      <div className="mx-auto p-1.5 bg-white rounded-xl flex shadow-lg">
        <div className={`${mapMode === 0 ? activeMapBtn : ''} py-1 px-2`} onClick={() => setMapMode(0)}>
          Map
        </div>
        <div className={`${mapMode === 1 ? activeMapBtn : ''} py-1 px-2 border-x-2 border-x-white ${mapMode === 0 ? 'border-r-slate-200' : mapMode === 2 ? 'border-l-slate-200' : ''}`} onClick={() => setMapMode(1)}>
          Hybrid
        </div>
        <div className={`${mapMode === 2 ? activeMapBtn : ''} py-1 px-2`} onClick={() => setMapMode(2)}>
          Terrain
        </div>
      </div>
    </div>
    <MapContainer 
      ref={map => {
        if(map) {
          if(refHook && !isMapSet) {
            refHook(map);
            setIMS(true);
          }
          map.on("zoomend", () => setZoom(map.getZoom()))
        }
      }}
      smoothWheelZoom={true}
      smoothSensitivity={1}
      // approximately the center of O'ahu
      center={center ?? [21.49201813922303, -157.9753182902885]}
      zoom={zoom ?? 11}
      minZoom={11}
      maxZoom={20}
      scrollWheelZoom={false}
      preferCanvas={true}
      doubleClickZoom={false}
      maxBounds={[
        // inside O'ahu
        [21.8, -157.5],
        [21.1, -158.4]
      ]}
      zoomControl={false}
      className="w-full h-[calc(100dvh-3rem)] z-0"
    >
      <SmoothWheelZoom/>
      <TileLayer
        // s is satellite view
        // h shows street names, places, etc.
        // m shows a mapped out view
        maxZoom={20}
        maxNativeZoom={18}
        url={
          mapMode === 2 ? 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 
          mapMode === 1 ? 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 
          /* mapMode is 0 */ 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
        }

        attribution={
          mapMode === 2 ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' :
          mapMode === 1 ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' :
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
      />
      {mapMode === 1 && <TileLayer
        maxZoom={20}
        maxNativeZoom={18}
        url='https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
        attribution='Labels &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />}
      <ZoomControl
        position="bottomright"
      />

      { /* Insert vehicle info */ }
      {Object.values(vehicleCache.current).map((v, i) => 
        <Marker
          key={"BUS" + v.number}
          position={[v.lat, v.lon]}
          icon={
            new L.Icon({
              iconUrl: GenerateBusSVG(v.number, v.tripInfo?.direction, v.tripInfo?.routeCode),
              iconSize: [zoomLvl/11 * 30, zoomLvl/11 * 30],
              popupAnchor:[0, -(zoomLvl/11 * 30)/2]
            })
          }
          zIndexOffset={i+100}
          ref={marker => {
            if(marker) {
              // prevents multiple events for the same thing being sent
              marker.off("popupopen");
              marker.off("popupclose");
              
              marker.on("popupopen", v.evtAdd);
              marker.on("popupclose", v.evtRem);
            }
          }}
        >
          <Popup
            closeOnClick={false}
            autoClose={false}
            autoPan={followBus}
          >
            <span><VehiclePopup vehicle={v}/></span>
          </Popup>
        </Marker>
      )}

      { /* Insert path */ }
      {routePath ? 
        routePath.map((s) => {
          const color = s.unfocused ? '#999999' : s.direction === 'East' ? "#ff0000" : "#0000ff";
          return <PolylineDecorator
            key={s.routePath.shapeId}
            pathOptions={{ fillOpacity: 1, color, weight: 2 }}
            positions={s.routePath.shapes.map(sh => [sh.lat, sh.lon])}
            patterns={s.unfocused ? [] : [
              { repeat: 125, symbol: L.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 1, color } }), offset: 0 }
            ]}
          />;
        })
      : <></>}

      { /* Insert stops */ }
      {stops ? 
        stops
          .map((s, i) => 
            <Marker
              key={"STOP" + s.stop}
              position={s.location}
              icon={new L.Icon({
                iconUrl: GenerateStopSVG(s.stop, noGPS, s.stale),
                iconSize: [zoomLvl/11 * 62/2, zoomLvl/11 * 120/2],
                iconAnchor: [zoomLvl/11 * 62/4, zoomLvl/11 * 120/2],
                popupAnchor:[0, -(zoomLvl/11 * 120/2)]
              })}
              autoPan={false}
              // put vehicles on top of stops
              zIndexOffset={-i-100}
            >
              <Popup 
                closeOnClick={false}
                autoPan={false}
              >
                <span className="min-w-fit">
                  {s.popup}
                </span>
              </Popup>
            </Marker>
          )
      : <></>}

      { /* Other leaflet components (e.g. circles) that we may want to add */}
      {otherComps}
    </MapContainer>
  </div>);
}

function GenerateBusSVG(vehicle: string, direction?: number, route?: string): string {
  const color = route ? brightenColor(getColorFromRoute({ code: route }), 0x111111) : "#ffffff";
  const text = route ? getContrastFromRoute({ code: route }) : '#000000';
  return "data:image/svg+xml," + encodeURIComponent(renderToStaticMarkup(<svg height={50} width={50} xmlns="http://www.w3.org/2000/svg">
    <rect width={50} height={25} fill={route ? "#dc9" : '#fff'} stroke="#000000" strokeWidth={2}/>
    <rect y={25} width={50} height={25} fill={color} stroke="#000000" strokeWidth={2}/>

    <text x={25} y={25/2+5.5} textAnchor='middle' fontFamily="Verdana">{vehicle}</text>
    <text x={25} y={25/2+25+5.5} textAnchor='middle' fill={text} fontFamily="Verdana">{direction === 0 && '«'}{route}{direction === 1 && '»'}</text>
  </svg>))
}

function GenerateStopSVG(stop: string, noGPS?: boolean, stale?: boolean): string {
  const font = 4 * 20 / 4;
  return "data:image/svg+xml," + encodeURIComponent(renderToStaticMarkup(<svg height={120} width={60+2} xmlns="http://www.w3.org/2000/svg">
    <polyline points="21,1 41,1 61,21 61,41 41,61 21,61 1,41 1,21 21,1 41,1" stroke="#000000" fill={!noGPS ? !stale ? "#ff0000" : "#dddddd" : "#cccccc"} strokeWidth={2}/>
    <rect x={(60 + 2 - 6)/2} y={(120+2)/2} width={6} height={120/2} stroke="#000000" fill="#dddddd" strokeWidth={2}/>

    <text x={(60 + 2)/2} y={1 + 20*2 - 20/2 + font/2.825} fontSize={font} textAnchor='middle' color="#000000" fontFamily="Verdana">{stop}</text>
  </svg>));
}