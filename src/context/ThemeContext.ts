import { createContext } from "react";
import type { Theme } from "~/lib/prefs";

const ThemeContext = createContext<[Theme, (theme: Theme) => void]|null>(null);
export default ThemeContext;