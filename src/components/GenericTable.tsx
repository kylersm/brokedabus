import type { PropsWithChildren } from "react";

export default function GenericTable(props: PropsWithChildren & { title?: string; noSmallSeparators?: boolean; noGap?: boolean; }) {
  return <div className="overflow-x-hidden">
    { /* table-fixed makes all columns equally sized */ }
    <table className={`md:px-4 text-left mx-auto ${!props.noGap ? 'border-spacing-y-5' : 'border-spacing-y-[0.03125rem]'} border-separate`}>
      <tbody className={
        !props.noSmallSeparators ? 
          "[&_tr:not(:last-child)>td]:border-b-2 [&_td]:pb-4 border-b-gray-500 [&_tr:not(:last-child)>td]:md:border-b-0 [&_td]:md:pb-0" : 
          "[&_td]:!pb-0 [&_td]:!border-b-0"
      }>
        {props.children}
      </tbody>
    </table>
  </div>;
}