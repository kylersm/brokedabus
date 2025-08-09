import { GeistSans } from "geist/font/sans";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import Head from "next/head";
import Navbar from "~/components/Navbar";
import { getTheme, setTheme, Theme } from "~/lib/prefs";
import { useEffect, useState } from "react";
import ThemeContext from "~/context/ThemeContext";

const MyApp: AppType = ({ Component, pageProps }) => {
  const [usableTheme, setUTheme] = useState<Theme>(Theme.LIGHT);
  const setNewTheme = (theme: Theme) => {
    setTheme(theme);
    const useDark = theme === Theme.DARK || (theme === Theme.AUTO && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if(useDark) {
      document.documentElement.classList.add("dark");
      setUTheme(Theme.DARK);
    } else {
      document.documentElement.classList.remove("dark");
      setUTheme(Theme.LIGHT);
    }
  }

  useEffect(() => {
    document.documentElement.classList.add("delay-100", "transition", "duration-500");
    setNewTheme(getTheme());
  }, []);

  return (<ThemeContext value={[usableTheme, setNewTheme]}>
    <div className={`${GeistSans.className} flex flex-col pt-12 h-dvh`}>
      <Head>
        <title>BrokeDaBus</title>
        <meta name="description" content="An open source version of DaBus2 app, catered to bus enthusiasts."/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta name="theme-color" content="#D4862A"/>
        <link rel="icon" href="/favicon.png"/>
      </Head>
      <Navbar/>
      {/* added h-full to expand 404 bg */}
      <div className="h-full overflow-y-scroll">
        <Component {...pageProps}/>
      </div>
    </div>
  </ThemeContext>);
};

export default api.withTRPC(MyApp);
