import { getColorFromRoute } from "~/lib/BusTypes";

export interface SuperficialRoute { id?: string; code: string; };

const CExpress = ['A', 'C', 'E']; // remove 'A' on 16th

/**
 * The route chip!
 * 
 * Route ID is only needed if we want to show skyline chip
 * 
 * @param props - Takes a route code and a route ID, and assigns it a color to dye the chip. Inactive makes text italic, inline adjusts CSS to fit inline.  
 * @returns - A react element.
 */
export default function RouteChip(props: { route: SuperficialRoute; inline?: boolean; inactive?: boolean; text?: string; }) {
  // show 'SKY' instead of blank text
  const isSkyline = props.route.id === "181" || props.route.code.toLowerCase() === "skyline";
  // check if it is a city/country express route
  const isCExpress = CExpress.includes(props.route.code.toUpperCase());
  const isLine = props.route.code.toUpperCase().endsWith(" LINE");
  // make 'w' lowercase except for W line
  const isWaikiki = props.route.code.toUpperCase().startsWith('W') && !isLine;

  let code = props.route.code;
  if(isSkyline)
    code = "SKY";
  else if(isWaikiki)
    code = code.toLowerCase();
  else if(isLine)
    code = code.slice(0, code.length - " LINE".length);

  return <div 
    className={`routechip ${props.inline ? "w-fit inline py-0.5" : "w-full max-w-16"} ${props.inactive ? "italic" : "font-semibold"}`} 
    style={{ backgroundColor: getColorFromRoute(props.route) }}
  >
    {isCExpress || isLine ? <div className="text-[75%] italic inline">三</div> : null}
    <div className={`${isCExpress || isLine ? "italic" : ""} inline`}>
      {props.text ?? code}
    </div>
  </div>;
}