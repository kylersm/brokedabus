import type { PropsWithChildren } from "react";

/**
 * A nicely formatted page so text isn't flush against the borders of the document.
 * 
 * @param props - Allow centering by default (mobile-eqsue).
 * @returns - A react element.
 */
const PadPage = (props: PropsWithChildren & { center?: boolean; }) => {
  return <div className="flex pt-4 mx-5 pb-12">
    <div className={`mx-auto w-full ${props.center ? 'text-center' : ''}`}>
      {props.children}
    </div>
  </div>
}

export default PadPage;