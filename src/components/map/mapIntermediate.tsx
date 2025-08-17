import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getHSTTime, HST_UTC_OFFSET, HSTify, quantifyTimeShortened } from "~/lib/util";
import Spinner from "../Spinner";
import { useTheme } from "~/context/ThemeContext";
import { Theme } from "~/lib/prefs";

// list of utilities for map-related purposes

// apparently we need useMemo or else anything requiring maps freezes
export const useMap = () => useMemo(() => dynamic(
  () => import("./map"),
  { 
    loading: () => <Spinner center/>,
    ssr: false
  }
), []);

export const isUnfocused = (openTrips: string[], shid: string, activeShapes?: string[]) => openTrips.length > 0 && !activeShapes?.map(s => s.toLowerCase()).includes(shid.toLowerCase());

// user can click on directions to filter routes going in the direction if set state is provided
export const DirectionKey = (props: { directionHook?: Dispatch<SetStateAction<number|undefined>> }) => {
  const darkTheme = useTheme()?.[0] === Theme.DARK;
  const [direction, setDirection] = useState<number>();
  // undefined none, 0 west, 1 east
  const onClickDirection = (value: number) => {
    if(props.directionHook) {
      const dir = direction === value ? undefined : value;
      setDirection(dir);
      props.directionHook(dir);
    }
  };

  return <p>Route Direction: <span 
    style={{ color: direction === undefined || direction === 0 ? darkTheme ? "#3af" : "#00f" : "#999"}} 
    onClick={() => onClickDirection(0)}
  >← Westbound</span>, <span
    style={{ color: direction === undefined || direction === 1 ? darkTheme ? "#f44" : "#f00" : "#999"}} 
    onClick={() => onClickDirection(1)}
  >Eastbound →</span><br/></p>;
}

export const LastUpdated  = () => <p className="font-normal italic">Last updated {HSTify(new Date(), true)}</p>;

// additional stop text for stop popups
// one vehicle option suppresses no gps text
export const StopArrival = (props: { arrives: number; vehicle?: string; oneVehicle?: boolean; }) => {
  // literally just to make the text look nicer
  const A = !props.vehicle && props.oneVehicle ? 'A' : 'a';
  const now = getHSTTime();
  // make sure the bus isn't arriving in 12 hours (not possible)
  const arrives = props.arrives - (props.arrives >= 12 * 60 * 60 ? 24 * 60 * 60 : 0);
  return <div className="text-base">
    <b>{<span className="font-bold">{props.vehicle ? `Bus ${props.vehicle} ` : props.oneVehicle ? '' : '[No GPS] '}</span>}{arrives < 0 ? 
      `${A}rrived at ${HSTify(new Date((arrives + now + HST_UTC_OFFSET) * 1000), true)}` : 
      arrives > 0 ? 
      `${A}rrives in ${quantifyTimeShortened(Math.abs(arrives))}` : 
      `${A}lready arrived`
    }</b>
    {arrives > 5*60 && <>
      <br/>
      <i className="pl-2">Expected arrival at {HSTify(new Date((arrives + now + HST_UTC_OFFSET) * 1000), true)}</i>
    </>}
  </div>
};