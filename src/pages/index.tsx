import Image from "next/image";
import { useState } from "react";
import PadPage from "~/components/templates/PadPage";

export default function Home() {
  const [showNudge, setSN] = useState<boolean>();
  return <>
    <div 
      onClick={() => setSN(false)}
      className={"m-2 p-2 bg-white shadow-lg shadow-[#00000055] " + (showNudge ? "block absolute" : "hidden")}
    >
      <div className="rotate-180 inline-block ml-1 font-bold text-lg">V</div><br/>
      This button takes you back to the previous page.
    </div>
    <PadPage center>
      <div className="text-5xl font-bold">BrokeDaBus</div>
      <Image className="mx-auto" src="/bus.png" width={250} height={250} alt="A picture of a bus with the headsign of the app name, and the author"/>
      <div className="text-xl font-semibold">Welcome to my app!</div>
      <div className="flex w-full text-left">
        <span className="mx-auto">
          <i>BrokeDaBus</i> is meant to be an enhanced version of the DaBus2 app.<br/><br/>

          <span onClick={() => setSN(!showNudge)} className="italic text-emerald-500 underline cursor-pointer">Navigating</span> is done via the top bar. You can also go back between pages using the back arrow button in the top left corner.<br/><br/>

          Features this app offers:<br/>
          <ul className="list-disc ml-5">
            <li>Showing stop arrivals and calendar</li>
            <li>Filter for stop arrivals</li>
            <li>Searching for stops and routes by name/street/headsign</li>
            <li>Showing multiple vehicles on a map</li>
            <li>Showing all active vehicles and stops for a route on a map/page</li>
            <li>Showing all vehicles on a map/page</li>
            <li>Showing a vehicle{"'"}s active trip, block info, and stops</li>
            <li>Keep track of your favorite bus stops</li>
          </ul><br/>

          If you want...<br/>
          <ul className="list-disc ml-5">
            <li>
              To know how to go from A to B
              <p className="ml-2">See <a className="link" href="https://transitapp.com/">Transit App</a> or your Maps app</p>
            </li>
            <li>
              To see service disruptions & detours
              <p className="ml-2">Visit <a className="link" href="https://thebus.org/">TheBus</a> website</p>
            </li>
            <li>
              To suggest new features for BrokeDaBus
              <p className="ml-2">Request at <a className="link" href="https://github.com/shringo/brokedabus/issues">BrokeDaBus</a> code repository</p>
            </li>
          </ul><br/>

          <b>Developer & Source Code</b><br/>
          <a className="link" href="https://github.com/shringo/brokedabus">shringo - BrokeDaBus</a><br/>
          <i>Not affiliated with Oahu Transit Services</i><br/><br/>

          <b>Inspired By</b><br/>
          <a className="link" href="https://pantographapp.com">Pantograph App</a><br/>
          <a className="link" href="https://hea.thebus.org/">TheBusHEA</a><br/><br/>

          <b>Tools Used</b><br/>
          <ul className="list-disc ml-5">
            <li><a className="link" href="https://hea.thebus.org/api_info.asp">TheBus ‘HEA API</a></li>
            <li><a className="link" href="https://leafletjs.com/">Leaflet</a></li>
            <li><a className="link" href="https://tailwindcss.com/">TailwindCSS (Styling)</a></li>
            <li><a className="link" href="https://create.t3.gg/">T3 stack</a></li>
          </ul><br/>
        </span>
      </div>
    </PadPage>
  </>
}