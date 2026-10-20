import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { widgetCatalog, type WidgetId } from "../config/widgets";
import { usePreferences } from "../prefs/PreferencesProvider";
import { EpicWidget, ShrinePreview, SteamWidget, WeatherWidget } from "../components/widgets/Widgets";
import { HelmetMark } from "../components/ui/feedback";
import { usePageMeta } from "./meta";

const widgetMap = {
  weather: WeatherWidget,
  steam: SteamWidget,
  epic: EpicWidget,
  shrine: ShrinePreview
} as const;

export function HomePage() {
  const { t } = useTranslation();
  const { prefs } = usePreferences();
  usePageMeta(t("meta.title"), t("meta.description"));
  const widgets = prefs.homeWidgets.filter((id): id is WidgetId => widgetCatalog.some((item) => item.id === id));

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1>{t("home.title")}</h1>
          <p className="lede">{t("home.lede")}</p>
          <div className="hero-actions">
            <Link className="cta" to="/gaming">
              {t("home.gaming")}
            </Link>
            <Link className="text-btn" to="/projects">
              {t("home.projects")}
            </Link>
          </div>
        </div>
        <HelmetMark />
      </section>
      <h2>{t("home.widgets")}</h2>
      <div className="grid widgets">
        {widgets.map((id) => {
          const View = widgetMap[id];
          return <View key={id} />;
        })}
      </div>
      {widgets.length === 0 ? <p>{t("common.empty")}</p> : null}
    </>
  );
}
