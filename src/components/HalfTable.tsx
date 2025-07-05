/**
 * Used to convey information of one part/half (e.g. eastbound westbound trips, or am pm stops)
 * 
 * @param props - Caption to set for the table, and table elements itself
 * @returns - A react element.
 */
export default function HalfTable(props: { caption: JSX.Element; } & React.PropsWithChildren) {
  return <table className="text-left mx-auto md:mx-2 border-spacing-y-2 border-separate px-4 table-fixed basis-1/2 h-fit md:w-auto">
    <caption className="text-2xl font-semibold mb-1">{props.caption}<hr/></caption>
    <tbody>
      {props.children}
    </tbody>
  </table>;
}