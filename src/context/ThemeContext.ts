import { createContext, type Dispatch, type SetStateAction } from "react";
import type { Theme } from "~/lib/prefs";

const ThemeContext = createContext<[Theme, Dispatch<SetStateAction<Theme>>]|null>(null);
export default ThemeContext;