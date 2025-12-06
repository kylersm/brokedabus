import { useState, type PropsWithChildren } from "react";

const ExpandArrowClass = "inline-flex font-normal text-neutral-500 dark:text-neutral-400";

export default function Collapser(props: {
  title: string;
  hideMsg: string;
  addHr?: boolean;
} & PropsWithChildren) {
  const [hide, setHide] = useState(false);
  return <div className="w-full">
    <div className="font-bold text-2xl w-fit mx-auto cursor-pointer transition-transform duration-100 ease-in" 
      onClick={() => setHide(h => !h)}>
      {props.title} <div 
        title={`Click to ${hide ? 'hide' : 'show'} ${props.title.toLowerCase()}`} 
        className={`${ExpandArrowClass} transition-transform duration-200 ease-out ${hide ? '' : 'rotate-180'}`}
      >V</div>
    </div>
    {props.addHr && <hr className="mt-3 mb-2" />}
    <div className={`transition-opacity duration-200 ease-out ${hide ? 'opacity-100' : 'opacity-0 hidden'}`}>{props.hideMsg} Click on the title to re-expand.</div>
    <div className={`transition-opacity duration-200 ease-out ${hide ? 'opacity-0 hidden' : 'opacity-100'}`}>{props.children}</div>
  </div>;
}