import { getColorFromRoute } from "~/lib/BusTypes";

export interface SuperficialRoute { id?: string; code: string; };

/**
 * The route chip!
 * 
 * Route ID is only needed if we want to show skyline chip
 * 
 * @param props - Takes a route code and a route ID, and assigns it a color to dye the chip. Inactive makes text italic, inline adjusts CSS to fit inline.  
 * @returns - A react element.
 */
export default function RouteChip(props: { route: SuperficialRoute; inline?: boolean; inactive?: boolean; }) {
  // show 'SKY' instead of blank text
  const isSkyline = props.route.id === "181" || props.route.code.toLowerCase() === "skyline";
  // check if it is a city/country express route
  const isCExpress = ['A', 'C', 'E'].includes(props.route.code.toUpperCase());
  // make 'w' lowercase
  const isWaikiki = props.route.code.toUpperCase().startsWith('W');
  return <div 
    className={`h-fit text-white text-center px-3 min-w-12 rounded-sm ${props.inline ? "w-fit inline py-0.5" : "w-full"} ${props.inactive ? "italic" : "font-semibold"}`} 
    style={{ backgroundColor: getColorFromRoute(props.route) }}
  >
    <span className={isCExpress ? "text-[75%] italic" : "hidden"}>三</span>
    <span className={isCExpress ? "italic" : ""}>{isSkyline ? "SKY" : isWaikiki ? props.route.code.toLowerCase() : props.route.code}</span>
  </div>;
}