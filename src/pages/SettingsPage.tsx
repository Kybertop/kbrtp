import { useTranslation } from "react-i18next";
import { widgetCatalog, type WidgetId } from "../config/widgets";
import { moveWidget, type Preferences } from "../prefs/storage";
import { usePreferences } from "../prefs/PreferencesProvider";
import { usePageMeta } from "./meta";

const tools = [
  ["shop", "/gaming/fortnite", "fortnite.shop"],
  ["returns", "/gaming/fortnite/returns", "fortnite.returns"],
  ["builds", "/gaming/dbd/builds", "dbd.builds"],
  ["shrine", "/gaming/dbd", "dbd.shrine"],
  ["free", "/gaming/free", "epic.title"]
] as const;

export function SettingsPage() {
  const { t } = useTranslation();
  const { prefs, update } = usePreferences();
  usePageMeta(t("settings.title"), t("settings.lede"));

  function toggleWidget(id: WidgetId) {
    const has = prefs.homeWidgets.includes(id);
    update({ homeWidgets: has ? prefs.homeWidgets.filter((item) => item !== id) : [...prefs.homeWidgets, id] });
  }

  return (
    <>
      <p className="eyebrow">{t("settings.eyebrow")}</p>
      <h1>{t("settings.title")}</h1>
      <p className="lede">{t("settings.lede")}</p>
      <div className="grid cards">
        <section className="card stack">
          <h2>{t("settings.language")}</h2>
          <select className="select" aria-label={t("settings.language")} value={prefs.language} onChange={(event) => update({ language: event.target.value as Preferences["language"] })}>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ru">Русский</option>
            <option value="zh-CN">简体中文</option>
          </select>
          <h2>{t("settings.theme")}</h2>
          <div className="row">
            <button className="text-btn" type="button" aria-pressed={prefs.theme === "black"} onClick={() => update({ theme: "black" })}>{t("settings.themeBlack")}</button>
            <button className="text-btn" type="button" aria-pressed={prefs.theme === "amoled"} onClick={() => update({ theme: "amoled" })}>{t("settings.themeAmoled")}</button>
          </div>
          <h2>{t("settings.accent")}</h2>
          <div className="row">
            {(["soft", "standard", "high"] as const).map((accent) => (
              <button key={accent} className="text-btn" type="button" aria-pressed={prefs.accent === accent} onClick={() => update({ accent })}>
                {t(accent === "soft" ? "settings.accentSoft" : accent === "high" ? "settings.accentHigh" : "settings.accentStandard")}
              </button>
            ))}
          </div>
        </section>
        <section className="card stack">
          <h2>{t("settings.temperature")}</h2>
          <div className="row">
            <button className="text-btn" type="button" aria-pressed={prefs.temperatureUnit === "celsius"} onClick={() => update({ temperatureUnit: "celsius" })}>{t("settings.celsius")}</button>
            <button className="text-btn" type="button" aria-pressed={prefs.temperatureUnit === "fahrenheit"} onClick={() => update({ temperatureUnit: "fahrenheit" })}>{t("settings.fahrenheit")}</button>
          </div>
          <h2>{t("settings.density")}</h2>
          <div className="row">
            <button className="text-btn" type="button" aria-pressed={prefs.density === "comfortable"} onClick={() => update({ density: "comfortable" })}>{t("settings.densityComfortable")}</button>
            <button className="text-btn" type="button" aria-pressed={prefs.density === "compact"} onClick={() => update({ density: "compact" })}>{t("settings.densityCompact")}</button>
          </div>
          <label>
            <input type="checkbox" checked={prefs.reducedMotion} onChange={(event) => update({ reducedMotion: event.target.checked })} /> {t("settings.motion")}
          </label>
          <label className="stack">
            {t("settings.rareDays")}
            <input className="field" type="number" min={1} max={5000} value={prefs.rareReturnDays} onChange={(event) => update({ rareReturnDays: Number(event.target.value) || 300 })} />
            <span className="hint">{t("settings.rareHelp")}</span>
          </label>
        </section>
        <section className="card stack">
          <h2>{t("settings.widgets")}</h2>
          {widgetCatalog.map((widget) => (
            <div className="row" key={widget.id}>
              <label>
                <input type="checkbox" checked={prefs.homeWidgets.includes(widget.id)} onChange={() => toggleWidget(widget.id)} /> {t(`${widget.id === "shrine" ? "dbd.shrine" : widget.id === "epic" ? "epic.title" : widget.id === "steam" ? "steam.title" : "weather.title"}`)}
              </label>
              <button className="text-btn" type="button" onClick={() => update({ homeWidgets: moveWidget(prefs.homeWidgets, widget.id, -1) })} aria-label={t("common.previous")}>↑</button>
              <button className="text-btn" type="button" onClick={() => update({ homeWidgets: moveWidget(prefs.homeWidgets, widget.id, 1) })} aria-label={t("common.next")}>↓</button>
            </div>
          ))}
          <h2>{t("settings.favorites")}</h2>
          {tools.map(([id, , label]) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={prefs.favoriteTools.includes(id)}
                onChange={() =>
                  update({
                    favoriteTools: prefs.favoriteTools.includes(id) ? prefs.favoriteTools.filter((item) => item !== id) : [...prefs.favoriteTools, id]
                  })
                }
              />{" "}
              {t(label)}
            </label>
          ))}
        </section>
      </div>
    </>
  );
}
