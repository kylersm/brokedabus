import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { type TripVehicle } from "~/lib/types";
import { ActiveType, SortType, type VehicleFiltering } from "./Vehicles";
import { BusInfos, FuelType, HeadsignColor, Manufacturer, routeTrafficTypes, type VehicleBlurb, VehicleInfo, WindowColor, WindowType } from "~/lib/BusTypes";
import { sortRouteCodes } from "~/lib/util";
import RouteChip from "./Route";
import { api } from "~/utils/api";

/**
 * Shows vehicle filtering options for the /vehicles/map and /vehicles page.
 * @param props - See below.
 * @returns - A react element.
 */
export default function VehicleFilterOptions(props: {
  // whether or not the page is shown
  showFilter: boolean,
  // a state setter for showing/hiding the filter options
  setSF: Dispatch<SetStateAction<boolean>>, 
  // yes we really need a list of vehicles (we really just need this to get the active routes)
  vehicles: TripVehicle[],

  // use route ids
  // useState for vehicles
  filters: VehicleFiltering,
  setFilters: Dispatch<SetStateAction<VehicleFiltering>>,
}) {

  const { showFilter, setSF, vehicles, 
    filters, setFilters: _setFilters } = props;

  const [showRF, setRF] = useState<boolean>(true);
  const { data: allRoutes } = api.gtfs.getAllRouteSuperficial.useQuery();

  // close when escape pressed
  useEffect(() => {
    const escClose = (e: KeyboardEvent) => {
      if (e.code === "Escape")
        setSF(false);
    };

    window.addEventListener("keydown", escClose);
    return () => window.removeEventListener("keydown", escClose);
  }, [setSF]);

  // so we don't need to do { ...filters, } everytime
  const setFilters = (vfo: Partial<VehicleFiltering>) => _setFilters({ ...filters, ...vfo });
  const setMakeModels = (predicate: (value: [string, VehicleBlurb]) => boolean) => setFilters({ makeModel: [...new Set(Object.entries(VehicleInfo).filter(predicate).map(([k]) => k as keyof typeof VehicleInfo).concat(filters.makeModel??[]))] });

  const activeRoutes = vehicles.filter(v => v.tripInfo !== undefined).map(v => ({ _id: v.tripInfo!.routeId, code: v.tripInfo!.routeCode })).filter((r, i, a) => a.findIndex(r2 => r2?._id === r?._id) === i);
  const busInfoValues = Object.values(BusInfos);
  const windowTypeKeys = Object.keys(WindowType) as (keyof typeof WindowType)[];
  const windowColorKeys = Object.keys(WindowColor) as (keyof typeof WindowColor)[];
  const headsignColorKeys = Object.keys(HeadsignColor) as (keyof typeof HeadsignColor)[];

  return <>
    <div className={`${showFilter ? 'block opacity-25' : 'hidden opacity-0'} transition delay-150 duration-300 absolute w-full h-full bg-black z-[45]`} onClick={() => setSF(false)}/>
    <div className={`${showFilter ? 'block opacity-100' : 'hidden opacity-0'} transition delay-150 duration-300 ease-in-out absolute w-[calc(100%-2*3.5rem)] h-[calc(100%-3rem-2*3.5rem)] z-[46] m-14 py-3 pb-10 px-5 md:px-12 bg-white shadow-2xl shadow-gray-500 rounded-lg overflow-y-scroll`}>
      <div className="mx-auto w-full text-center overflow-hidden">
        <div className="absolute top-2 right-3 cursor-pointer text-red-500 font-bold" onClick={() => setSF(false)}>X</div>
        <div className="font-bold text-2xl">
          Vehicle Filter Options
          <hr className="md:hidden my-2"/>
        </div>
        <div className="mx-auto w-fit space-y-3">
          <div className="w-full md:flex block items-center">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit md:mr-7">Last Message:</p>
            <div className="!ml-0 md:ml-0 gap-x-6 flex flex-wrap justify-center">
              <label className="whitespace-nowrap"><input type="radio" className="mr-1" name="lastmessage" checked={filters.lastMessage === ActiveType.DAY} onChange={() => setFilters({ lastMessage: ActiveType.DAY})}/>Last 24 hours</label>
              <label className="whitespace-nowrap"><input type="radio" className="mr-1" name="lastmessage" checked={filters.lastMessage === ActiveType.WEEK} onChange={() => setFilters({ lastMessage: ActiveType.WEEK})}/>Last 7 days</label>
              <label className="whitespace-nowrap"><input type="radio" className="mr-1" name="lastmessage" checked={filters.lastMessage === ActiveType.MONTH} onChange={() => setFilters({ lastMessage: ActiveType.MONTH})}/>Last 30 days</label>
              <label className="whitespace-nowrap"><input type="radio" className="mr-1" name="lastmessage" checked={filters.lastMessage === ActiveType.ALL} onChange={() => setFilters({ lastMessage: ActiveType.ALL})}/>Anytime</label>
            </div>
          </div>
          <div className="w-full md:flex block items-center">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit md:mr-7">Sort:</p>
            <div className="!ml-0 md:ml-0 space-x-6 flex flex-wrap justify-center">
              <label className="md:block">Ascending? <input type="checkbox" className="ml-1" checked={filters.ascendSort} onChange={() => setFilters({ ascendSort: !filters.ascendSort })}/></label>
              <div className="basis-full h-0 md:hidden"/>
              <label className="whitespace-nowrap"><input type="radio" className="mr-1" name="sort" checked={filters.sortType === SortType.DATE} onChange={() => setFilters({ sortType: SortType.DATE })}/>Last message</label>
              <label className="whitespace-nowrap"><input type="radio" className="mr-1" name="sort" checked={filters.sortType === SortType.NUMBER} onChange={() => setFilters({ sortType: SortType.NUMBER })}/>Vehicle number</label>
              <label className="whitespace-nowrap"><input type="radio" className="mr-1" name="sort" checked={filters.sortType === SortType.ROUTE} onChange={() => setFilters({ sortType: SortType.ROUTE })}/>Route</label>
            </div>
          </div>
          <div className="w-full md:flex block items-center">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit md:mr-7">Activity:</p>
            <div className="!ml-0 md:ml-0 gap-x-6 flex flex-wrap justify-center">
              <label className="whitespace-nowrap">Has route? <input type="checkbox" className="ml-1" checked={filters.hasRoute} onChange={() => setFilters({ hasRoute: !filters.hasRoute })}/></label>
              <label className="whitespace-nowrap">Has driver? <input type="checkbox" className="ml-1" checked={filters.hasDriver} onChange={() => setFilters({ hasDriver: !filters.hasDriver })}/></label>
            </div>
          </div>
        </div>

        <div className="font-bold text-2xl mt-5 md:mt-0" onClick={() => setRF(!showRF)}>
          Route Filters <div title={'Click to ' + (showRF ? 'hide' : 'show') + ' route filters'} className={"inline-flex font-normal text-gray-500 " + (showRF ? '' : 'rotate-180')}>V</div>
        </div>

        {showRF && <><div className="w-fit gap-x-7 text-center overflow-x-auto flex flex-wrap justify-center mx-auto">
          <span className="text-emerald-500 underline cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => 
            setFilters({ routeIdFilters: [...new Set(allRoutes?.filter(r => routeTrafficTypes.urban.includes(r.code)).map(r => r._id).concat(filters.routeIdFilters??[]))]})}
          >Select all Urban</span>
          <span className="text-emerald-500 underline cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => 
            setFilters({ routeIdFilters: [...new Set(allRoutes?.filter(r => routeTrafficTypes.suburban.includes(r.code)).map(r => r._id).concat(filters.routeIdFilters??[]))]})}
          >Select all Suburban</span>
          <span className="text-emerald-500 underline cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => 
            setFilters({ routeIdFilters: [...new Set(allRoutes?.filter(r => routeTrafficTypes.local.includes(r.code)).map(r => r._id).concat(filters.routeIdFilters??[]))]})}
          >Select all Local</span>
          <span className="text-emerald-500 underline cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => 
            setFilters({ routeIdFilters: [...new Set(allRoutes?.filter(r => r.code.length && !(routeTrafficTypes.urban.concat(...routeTrafficTypes.suburban, ...routeTrafficTypes.local)).includes(r.code)).map(r => r._id).concat(filters.routeIdFilters??[]))]})}
          >Select all Commuter</span>
          <span className="text-emerald-500 underline cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => 
            setFilters({ routeIdFilters: activeRoutes.map(r => r._id) })}
          >Select active only</span>
          <span className="text-emerald-500 underline cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => 
            setFilters({ routeIdFilters: undefined })}
          >Select all</span>
          <span className="text-emerald-500 underline cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => 
            setFilters({ routeIdFilters: [] })}
          >Unselect All</span>
        </div>

        <div className="bg-gray-50 shadow-inner shadow-gray-400 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 text-left p-3 px-4 rounded-md mt-3 mb-7">{(allRoutes ?? []).sort((a, b) => sortRouteCodes(a.code, b.code)).map(r => 
          <label key={"Route-"+r._id} className={`flex gap-2 pr-3 h-fit w-full ${(!activeRoutes.some(a => a._id === r._id) ? "italic" : "")}`}>
            <input type="checkbox" className="mb-auto mt-1.5" checked={!filters.routeIdFilters || filters.routeIdFilters?.includes(r._id)} onChange={(e) => 
              !filters.routeIdFilters ? setFilters({ routeIdFilters: allRoutes?.map(a => a._id).filter(a => a !== r._id)}) : 
                setFilters({ routeIdFilters: !e.target.checked ? filters.routeIdFilters.filter(f => f !== r._id) :
                  filters.routeIdFilters.concat(r._id)})
            }/> <span><RouteChip route={{ code: r.code, id: r._id }}/></span> {r.name}
          </label>
        )}</div></>}

        <div className="mx-auto w-fit space-y-3">
          <div className="font-bold text-2xl">
            Vehicle Model Filters
          </div>

          <div className="font-bold text-lg mt-3">
            Fuel Type & Length
          </div>
          <div className="w-full flex items-center gap-x-6 flex-wrap justify-center md:justify-normal whitespace-nowrap ">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit">Fuel:</p>
            <div className="basis-full h-0 md:hidden"/>
            {Object.keys(FuelType).map(fuel =>
              <p key={'F' + fuel} className="text-emerald-500 underline" onClick={() => 
                setMakeModels(([_, v]) => v.fuelType === (fuel as keyof typeof FuelType))}
              >Select {fuel}</p>
            )}
          </div>
          <div className="w-full flex items-center gap-x-6 flex-wrap justify-center md:justify-normal whitespace-nowrap ">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit">Length:</p>
            <div className="basis-full h-0 md:hidden"/>
            {[...new Set(Object.values(VehicleInfo).map(vi => vi.length))].sort((a, b) => a - b).map(len =>
              <p key={'L' + len} className="text-emerald-500 underline" onClick={() => 
                setMakeModels(([_, v]) => v.length === len)
              }>Select {len}{"'"}</p>
            )}
          </div>
          <div className="w-full flex items-center gap-x-6 flex-wrap justify-center md:justify-normal whitespace-nowrap ">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit">Articulated:</p>
            <div className="basis-full h-0 md:hidden"/>
            <p className="text-emerald-500 underline" onClick={() => 
              setMakeModels(([_, v]) => v.articulated)}
            >
              Select articulated
              </p>
            <p className="text-emerald-500 underline" onClick={() => 
              setMakeModels(([_, v]) => !v.articulated)}
            >
              Select conventional
              </p>
          </div>

          <div className="font-bold text-lg mt-3">
            Model Independent Features
          </div>
          <div className="w-full flex items-center gap-x-6 flex-wrap justify-center md:justify-normal whitespace-nowrap ">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit">Window Type:</p>
            <div className="basis-full h-0 md:hidden"/>
            {windowTypeKeys.map(wt => <label key={"WT-"+wt}>{WindowType[wt]} <input type="checkbox" className="ml-1" checked={!filters.windowType || filters.windowType?.includes(WindowType[wt])} onChange={() =>
              setFilters({ windowType: !filters.windowType ? windowTypeKeys.filter((k): k is WindowType => k !== WindowType[wt]) : filters.windowType.includes(WindowType[wt]) ?
                filters.windowType.filter(w => w !== WindowType[wt]) : filters.windowType.concat(WindowType[wt])
              })
            }/></label>)}
          </div>
          <div className="w-full flex items-center gap-x-6 flex-wrap justify-center md:justify-normal whitespace-nowrap ">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit">Window Color:</p>
            <div className="basis-full h-0 md:hidden"/>
            {windowColorKeys.map(wc => <label key={"WC-"+wc}>{WindowColor[wc]} <input type="checkbox" className="ml-1" checked={!filters.windowColor || filters.windowColor?.includes(WindowColor[wc])} onChange={() =>
              setFilters({ windowColor: !filters.windowColor ? windowColorKeys.filter((k): k is WindowColor => k !== WindowColor[wc]) : filters.windowColor.includes(WindowColor[wc]) ?
                filters.windowColor.filter(w => w !== WindowColor[wc]) : filters.windowColor.concat(WindowColor[wc])
              })
            }/></label>)}
          </div>
          <div className="w-full flex items-center gap-x-6 flex-wrap justify-center md:justify-normal whitespace-nowrap ">
            <p className="font-bold mx-auto md:mx-0 text-lg w-fit">Headsign Color:</p>
            <div className="basis-full h-0 md:hidden"/>
            {headsignColorKeys.map(hsc => <label key={"HSC-"+hsc}>{HeadsignColor[hsc]} <input type="checkbox" className="ml-1" checked={!filters.headsignColor || filters.headsignColor?.includes(HeadsignColor[hsc])} onChange={() =>
              setFilters({ headsignColor: !filters.headsignColor ? headsignColorKeys.filter((k): k is HeadsignColor => k !== HeadsignColor[hsc]) : filters.headsignColor.includes(HeadsignColor[hsc]) ?
                filters.headsignColor.filter(w => w !== HeadsignColor[hsc]) : filters.headsignColor.concat(HeadsignColor[hsc])
              })
            }/></label>)}
          </div>
          <div className="w-full flex items-center gap-x-6 flex-wrap justify-center whitespace-nowrap ">
            <label>Left Headsign Only? <input type="checkbox" className="ml-1" checked={filters.leftHeadsign} onClick={() =>
              setFilters({ leftHeadsign: !filters.leftHeadsign })
            }/></label>
            <label>Include unknown types? <input type="checkbox" className="ml-1" checked={filters.includeUnknown} onChange={() => 
              setFilters({ includeUnknown: !filters.includeUnknown })
            }/></label>
          </div>
        </div>

        <div className="font-bold text-lg mt-5">
          Vehicle Make & Model
        </div>

        <div className="w-fit mx-auto flex gap-x-6">
          <p className="text-emerald-500 underline" onClick={() => setFilters({ makeModel: undefined })}>Select all</p>
          <p className="text-emerald-500 underline" onClick={() => setFilters({ makeModel: [] })}>Unselect all</p>
        </div>

        <div className="bg-gray-50 shadow-inner shadow-gray-400 gap-y-2 text-left p-3 px-4 mt-2 rounded-md">
          <div className="sm:flex w-fit sm:w-full mx-auto">
            {Object.keys(Manufacturer).map(man => <div key={"V"+man} className="w-full mb-3">
              <p className="flex gap-2 pr-3 h-fit w-full font-bold text-center underline text-emerald-500" onClick={() => setFilters({
                makeModel: [...new Set(Object.entries(VehicleInfo).filter(v => v[1].manufacturer === Manufacturer[man as keyof typeof Manufacturer]).map(([k]) => k as keyof typeof VehicleInfo).concat(filters.makeModel??[]))]
              })}>
                All {Manufacturer[man as keyof typeof Manufacturer]}s
              </p>
              {Object.entries(VehicleInfo).filter(v => v[1].manufacturer === Manufacturer[man as keyof typeof Manufacturer]).map(([k, vi]) => 
                <p key={vi.manufacturer+vi.desc+vi.length+vi.fuelType} className="flex gap-2 pr-3 h-fit w-full">
                  <input type="checkbox" 
                    disabled={!busInfoValues.filter(v => v.model === vi).some(v => 
                      (!filters.headsignColor || filters.headsignColor?.includes(v.headsignColor)) &&
                      (!filters.windowColor || filters.windowColor?.includes(v.windowColor)) &&
                      (!filters.windowType || filters.windowType?.includes(v.windowType)) &&
                      (!filters.leftHeadsign || v.leftHeadsign)
                    )}
                    checked={!filters.makeModel || filters.makeModel.includes(k as keyof typeof VehicleInfo)}
                    onChange={() => !filters.makeModel ? setFilters({ makeModel: Object.keys(VehicleInfo).filter((k2): k2 is keyof typeof VehicleInfo => k2 !== k as keyof typeof VehicleInfo) }) :
                      setFilters({ makeModel: filters.makeModel.includes(k as keyof typeof VehicleInfo) ? 
                        filters.makeModel.filter(m => m !== k) :
                        filters.makeModel.concat(k as keyof typeof VehicleInfo)
                      })
                    }
                  /> {vi.shortDesc} {vi.length}{"'"}
                </p>
              )}
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </>
}