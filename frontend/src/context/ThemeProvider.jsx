/**
 * @file src/context/ThemeProvider.jsx
 */
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
});

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "tenderhub-theme" }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(storageKey) || defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme: (t) => { localStorage.setItem(storageKey, t); setTheme(t); } }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeProviderContext);