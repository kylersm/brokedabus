import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return <Html>
    <Head />
    <body>
      <Main/>
      <NextScript/>
      <Script
        id="fouc-theme"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `const theme = localStorage.getItem("theme") ?? 'A';
                  if(theme === 'D' || (theme === 'A' && window.matchMedia("(prefers-color-scheme: dark)").matches))
                    document.documentElement.classList.add("dark");`
        }}
      />
    </body>
  </Html>;
};