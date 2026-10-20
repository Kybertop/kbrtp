import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { loadPreferences, savePreferences, type Preferences } from "./storage";

type PreferencesContextValue = {
  prefs: Preferences;
  update: (patch: Partial<Preferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [prefs, setPrefs] = useState<Preferences>(() => loadPreferences());

  useEffect(() => {
    savePreferences(prefs);
    document.documentElement.lang = prefs.language;
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.accent = prefs.accent;
    document.documentElement.dataset.density = prefs.density;
    const systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.motion = prefs.reducedMotion || systemReduce ? "reduce" : "full";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", prefs.theme === "amoled" ? "#050505" : "#d6ff00");
    if (i18n.language !== prefs.language) void i18n.changeLanguage(prefs.language);
  }, [prefs, i18n]);

  const value = useMemo(
    () => ({
      prefs,
      update: (patch: Partial<Preferences>) => setPrefs((current) => ({ ...current, ...patch }))
    }),
    [prefs]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("Preferences missing");
  return value;
}
