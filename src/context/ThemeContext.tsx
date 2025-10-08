import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";
import { getTheme as getLocalStorageTheme, setTheme as setLocalStorageTheme, Theme, THEME_KEY } from "~/lib/prefs";

const ThemeContext = createContext<[Theme, (theme: Theme) => void]|null>(null);
export const useTheme = () => useContext(ThemeContext);
export const ThemeProvider = (props: PropsWithChildren) => {
  const [usableTheme, setBinaryTheme] = useState<Theme>(Theme.LIGHT);
  const setNewTheme = (theme: Theme) => {
    setLocalStorageTheme(theme);
    const useDark = theme === Theme.DARK || (theme === Theme.AUTO && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if(useDark) {
      document.documentElement.classList.add("dark");
      setBinaryTheme(Theme.DARK);
    } else {
      document.documentElement.classList.remove("dark");
      setBinaryTheme(Theme.LIGHT);
    }
  }

  useEffect(() => {
    document.documentElement.classList.add("delay-100", "transition", "duration-500");
    setNewTheme(getLocalStorageTheme());
  }, []);

  useEffect(() => {
    const onLSChange = (ev: StorageEvent) => {
      if(ev.key === THEME_KEY)
        setNewTheme(getLocalStorageTheme());
    }
    window.addEventListener("storage", onLSChange);
    return () => window.removeEventListener("storage", onLSChange);
  }, []);

  return <ThemeContext value={[usableTheme, setNewTheme]}>
    {props.children}
  </ThemeContext>;
}