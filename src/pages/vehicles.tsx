import { useState } from "react";
import PadPage from "~/components//templates/PadPage";
import Vehicles, { defaultVehicleFilters, type VehicleFiltering } from "~/components//Vehicles";
import { api } from "~/utils/api";
import VehicleFilterOptions from "~/components//VehicleFilterOptions";
import Link from "next/link";
import HeadTitle from "~/components//HeadTitle";

export default function VehiclesList() {
  const [filters, setFilters] = useState<VehicleFiltering>({ ...defaultVehicleFilters });
  const { data: vehicles } = api.hea.getVehiclesTO.useQuery({ }, {
    refetchInterval: 10 * 1000
  });

  const [showFilter, setSF] = useState<boolean>(false);

  return (<>
    <HeadTitle>All Vehicles Overview</HeadTitle>
    <VehicleFilterOptions
      showFilter={showFilter}
      setSF={setSF} 
      vehicles={vehicles??[]}
      filters={filters} setFilters={setFilters}
    />
    <PadPage center>
      <div className="mx-auto w-full text-center mb-5">
        <div className="font-bold text-2xl">
          Vehicles List
        </div>
        <div className="flex">
          <div className="flex mx-auto gap-x-5">
            <div className="text-emerald-500 underline cursor-pointer" onClick={() => setSF(true)}>
              Click to see filter options
            </div>
            <Link className="link" href={"/vehicles/map"}>
              View map
            </Link>
          </div>
        </div>
      </div>
      <Vehicles 
        vehicles={vehicles}
        filters={filters}
      />
    </PadPage>
  </>);
}