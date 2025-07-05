import Head from "next/head";
import type { PropsWithChildren } from "react";
import { renderToString } from "react-dom/server";

/**
 * Sets the title of the page, and adds 'BrokeDaBus' watermark
 * 
 * Rule of thumb: try to convey page titles with the least amount of text possible esp. if you have tons of tabs open
 * 
 * @param props - Text to set the title to.
 * @returns - A react element.
 */
export default function HeadTitle(props: PropsWithChildren) {
  return <Head>
    <title>
      {`${renderToString(props.children)} | BrokeDaBus`}
    </title>
  </Head>
}