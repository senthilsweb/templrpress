"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ThemeName, TitleFontName } from "@/lib/config";

interface ThemeContextValue {
  theme: ThemeName;
  darkMode: boolean;
  titleFont: TitleFontName;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: () => void;
  setTitleFont: (font: TitleFontName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "selectedTheme";
const DARK_MODE_STORAGE_KEY = "darkMode";
const TITLE_FONT_STORAGE_KEY = "titleFont";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("navy");
  const [darkMode, setDarkMode] = useState(false);
  const [titleFont, setTitleFontState] = useState<TitleFontName>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
    const storedDark = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    const storedTitleFont = localStorage.getItem(TITLE_FONT_STORAGE_KEY) as TitleFontName | null;
    if (storedTheme) setThemeState(storedTheme);
    if (storedDark === "true") setDarkMode(true);
    if (storedTitleFont) setTitleFontState(storedTitleFont);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem("colorTheme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.toggle("dark-mode", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(darkMode));
  }, [darkMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.body.setAttribute("data-title-font", titleFont);
    localStorage.setItem(TITLE_FONT_STORAGE_KEY, titleFont);
  }, [titleFont, mounted]);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const setTitleFont = useCallback((f: TitleFontName) => {
    setTitleFontState(f);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, darkMode, titleFont, setTheme, toggleDarkMode, setTitleFont }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
