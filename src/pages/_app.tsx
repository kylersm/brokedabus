import { GeistSans } from "geist/font/sans";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import Head from "next/head";
import Navbar from "~/components/Navbar";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <div className={`${GeistSans.className} flex flex-col pt-12 h-dvh`}>
      <Head>
        <title>BrokeDaBus</title>
        <meta name="description" content="An open source version of DaBus2 app, catered to bus enthusiasts."/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link rel="icon" href="/favicon.png"/>
      </Head>
      <Navbar/>
      {/* added h-full to expand 404 bg */}
      <div className="h-full overflow-y-scroll">
        <Component {...pageProps}/>
      </div>
    </div>
  );
};

export default api.withTRPC(MyApp);
