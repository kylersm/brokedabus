import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return <Html>
    <Head />
    <body>
      <Script src="/FOUCTheme.js" strategy="beforeInteractive"/>
      <Main/>
      <NextScript/>
    </body>
  </Html>;
};