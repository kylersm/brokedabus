import HeadTitle from "~/components//HeadTitle";
import { AllBusses } from "~/components//map/intermediary/AllBusses";

// Map of all busses
export default function Map() {
  return <>
    <HeadTitle>All Vehicles Map</HeadTitle>
    <AllBusses/>
  </>;
}
