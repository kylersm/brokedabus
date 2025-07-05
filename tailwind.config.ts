import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        jpn: [""]
      },
      boxShadow: {
        nav: ['0px 0px 7px 1px black']
      },
      backgroundColor: {
        urban: "#B97C2A",
        suburban: "#2E6CA9",
        local: "#699F61",    
        commute: "#B39EAA"
      }
    },
  },
  plugins: [],
} satisfies Config;
