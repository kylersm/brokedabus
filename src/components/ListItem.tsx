import type { Url } from "next/dist/shared/lib/router/router";
import Link from "next/link";
import { type JSX, type PropsWithChildren } from "react";

interface BaseProp {
  href?: Url;           // arrow will appear if this exists.
  topArrow?: boolean;   // center instead of vertically aligning the arrow to center
  topEmoji?: boolean;   // forces arrow and image to be near the top if we know content is too big
}

interface NoIconProp extends BaseProp {
  emoji?: never;
  image?: never;
}

interface TextItemProp extends BaseProp {
  emoji?: string | JSX.Element;
  image?: never;
}

function Linkify(props: PropsWithChildren & { href?: Url }) {
  if(props.href)
    return <Link href={props.href}>{props.children}</Link>;
  else
    return props.children;
}

/**
 * Main element used to put information inside a table. 
 * 
 * TEMPLATE:
 *  [ Img ] [contents] [Arrow to indicate you can be taken to another page]
 * 
 * @param props - The children to put inside the middle table column
 *                A link to set the whole table row to
 *                An image or text (or nothing) to set the leftmost column to.
 * @returns - A react element.
 */
export default function ListItem(props: PropsWithChildren & (TextItemProp | NoIconProp)) {
  let SideIcon: JSX.Element = <></>;
  if(props.emoji) {
    SideIcon = <div className={`${typeof props.emoji === "string" ? "text-4xl" : ""} ml-auto min-w-fit`}>
      {props.emoji}
    </div>;
  }

  const finalElement = <tr>
    <td className={`w-fit pr-2 ${props.topEmoji ? "align-top" : ""}`}>
      <Linkify href={props.href}>
        {SideIcon}
      </Linkify>
    </td>

    <td className="h-fit min-h-12 pr-2 align-middle">
      <Linkify href={props.href}>
        <div className="w-fit">{props.children}</div>
      </Linkify>
    </td>

    {props.href ? <td className={props.topArrow ? 'align-top' : ''}>
      <Link href={props.href} className="pl-1 text-5xl font-mono">
        <svg className="inline" height={30} width={30} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <line strokeLinecap="round" className="item-arrow" x1={30} y1={55} x2={55} y2={30} strokeWidth={5}/>
          <line strokeLinecap="round" className="item-arrow" x1={30} y1={5} x2={55} y2={30} strokeWidth={5}/>
        </svg>
      </Link>
    </td> : <></>}
  </tr>;
  return finalElement;
}