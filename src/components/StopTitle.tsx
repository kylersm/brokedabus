import type { PolishedStop } from "~/lib/types";

/**
 * Stop title text used on /stop/[stop] pages (no map).
 * 
 * Shows information (if stop is facility garage, rail stop, etc.)
 * 
 * @param props - The stop to analyze.
 * @returns - A react element.
 */
export default function StopTitle(props: { stop: PolishedStop; }) {
  const { stop } = props;
  const isRailStop = Math.floor(parseInt(stop.code) / 10_000) === 1;
  const isGarage = Math.floor(parseInt(stop.code) / 30_000) === 1 || stop.name.toLowerCase().includes("facility garage");
  return <div>
    <span className="font-bold text-2xl">Stop {stop.code}: <br className="sm:hidden block"/>{stop.name}</span><br/>
    {isRailStop ? <i>This is a station exclusive to the Skyline metro. All trains on Skyline lack GPS.</i> : ''}
    {isGarage ? <i>This is a placeholder stop only intended for drivers returning after their shift. Arrivals are not listed.</i> : ''}
  </div>;
}