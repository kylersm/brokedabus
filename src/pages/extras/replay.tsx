import { useEffect, useRef, useState } from "react";
import type { SuperficialVehicle } from "~/components/map/map";
import { useMap } from "~/components/map/mapIntermediate";

interface FileFormat {
  num: string,
  drv: number,
  pos: [number, number],
  adh: number,
  upd: string,
  trip?: (string | undefined)[];
  dir?: number;
  code?: string;
  headsign?: string;
};

export default function Replay() {
  const Map = useMap();

  const vehicles = useRef<Record<string, SuperficialVehicle[]>>({});
  const keys: (keyof typeof vehicles.current)[] = Object.keys(vehicles.current).sort((a, b) => Date.parse(a) - Date.parse(b));

  const [pause, setPause] = useState(false);
  const [prog, setProg] = useState(-1);
  const floorProg = Math.floor(prog);
  const maxSpeed = 100;
  const [speed, setSpeed] = useState(50);
  const [max, setMax] = useState(0);

  const [fin, setFin] = useState(false);

  useEffect(() => {
    if(pause) return;
    const interval = setInterval(() => {
      setProg(p => (p + (speed / maxSpeed)) % max);
    }, 10);
    return () => clearInterval(interval);
  }, [max, fin, pause, speed]);

  const d = prog % 1;

  return <Map
    header={<>
      <div>{Date.parse(keys[floorProg] ?? '') ? new Date(keys[floorProg]!).toLocaleString() : keys[floorProg]}</div>
      <div className="flex w-fit mx-auto gap-x-2">
        <label className="cursor-pointer border-2 border-gray-500 rounded-md px-2 py-0.5 bg-gray-200">
          Select Trips
          <input className="hidden" type="file" multiple onChange={async (e) => {
          const files = e.target.files;
          if (files) {
            for(let i = 0; i < files.length; i++) {
              const file = files.item(i);
              if(!file) continue;
              const name = file.name.slice(0, -5);
              const text = JSON.parse(await file.text()) as FileFormat[];
              vehicles.current[name] = text.map((x): SuperficialVehicle => ({  
                adherence: x.adh,
                last_message: new Date(x.upd),
                lat: x.pos[0],
                lon: x.pos[1],
                number: x.num,
                driver: x.drv,
                tripInfo: x.code && x.headsign ? {
                  routeId: '',
                  routeCode: x.code,
                  headsign: x.headsign,
                  displayCode: '',
                  shapeId: '',
                  trips: [],
                  direction: x.dir ?? 0,
                  firstArrives: 0, lastDeparts: 48 * 60 * 60,
                } : undefined
              }));
            }
            setProg(-1);
            setMax(files.length);
            setFin(false);
          }
          }}/>
        </label>
        <input type="button" onClick={() => setPause(p => !p)} value={pause ? "Play" : "Pause"} className="border-2 border-gray-500 rounded-md px-2 bg-gray-200"/>
        <input className="my-auto" type="range" min={1} value={speed} max={maxSpeed} step={1} onChange={e => setSpeed(e.target.valueAsNumber)}/>
      </div>
      <input type="range" min={0} value={prog} max={max} step={1} onChange={e => setProg(e.target.valueAsNumber)}/>
    </>}
    wipeBus={(v) => !vehicles.current[keys[floorProg]!]?.some(ve => ve.number === v.number)}
    vehicles={vehicles.current[keys[floorProg]!]?.map((x) => {
      if(!keys[floorProg+1]) return x;
      const next = vehicles.current[keys[floorProg+1]!]!.find(v => v.number === x.number);
      if(!next) return x;
      const latd = (next.lat - x.lat) * d + x.lat;
      const lond = (next.lon - x.lon) * d + x.lon;
      return { ...x, lat: latd, lon: lond };
    })}
  />;
}