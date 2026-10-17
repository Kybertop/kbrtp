import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { EpicWidget, ShrinePreview, SteamWidget } from "../../components/widgets/Widgets";
import { profile } from "../../config/profile";
import { outlastStatus } from "../../providers/outlast";
import { loadSteam } from "../../providers/steam";
import { usePreferences } from "../../prefs/PreferencesProvider";
import { usePageMeta } from "../meta";

const links = [
  ["/gaming", "gaming.overview", true],
  ["/gaming/fortnite", "fortnite.shop", false],
  ["/gaming/fortnite/returns", "fortnite.returns", false],
  ["/gaming/fortnite/search", "fortnite.search", false],
  ["/gaming/dbd", "dbd.shrine", false],
  ["/gaming/dbd/builds", "dbd.builds", false],
  ["/gaming/dbd/perks", "dbd.perks", false],
  ["/gaming/outlast", "outlast.title", false],
  ["/gaming/steam", "steam.title", false],
  ["/gaming/free", "epic.title", false]
] as const;

export function GamingLayout() {
  const { t } = useTranslation();
  return (
    <>
      <nav className="section-nav" aria-label={t("gaming.title")}>
        {links.map(([to, key, end]) => (
          <NavLink key={to} to={to} end={end}>
            {t(key)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  );
}

const favorites = [
  ["shop", "/gaming/fortnite", "fortnite.shop"],
  ["returns", "/gaming/fortnite/returns", "fortnite.returns"],
  ["builds", "/gaming/dbd/builds", "dbd.builds"],
  ["shrine", "/gaming/dbd", "dbd.shrine"],
  ["free", "/gaming/free", "epic.title"]
] as const;

export function GamingOverviewPage() {
  const { t } = useTranslation();
  const { prefs } = usePreferences();
  usePageMeta(t("gaming.title"), t("gaming.lede"));
  const cards = [
    ["/gaming/fortnite", "fortnite.title", "gaming.fortniteBody"],
    ["/gaming/dbd", "dbd.title", "gaming.dbdBody"],
    ["/gaming/outlast", "outlast.title", "gaming.outlastBody"],
    ["/gaming/steam", "steam.title", "gaming.steamBody"],
    ["/gaming/free", "epic.title", "gaming.freeBody"]
  ] as const;
  return (
    <>
      <p className="eyebrow">{t("gaming.eyebrow")}</p>
      <h1>{t("gaming.title")}</h1>
      <p className="lede">{t("gaming.lede")}</p>
      {prefs.favoriteTools.length ? (
        <div className="row">
          {favorites.filter(([id]) => prefs.favoriteTools.includes(id)).map(([id, to, label]) => (
            <Link key={id} className="text-btn" to={to}>{t(label)}</Link>
          ))}
        </div>
      ) : null}
      <div className="grid cards">
        {cards.map(([to, title, body]) => (
          <Link key={to} className="card" to={to}>
            <h2>{t(title)}</h2>
            <p>{t(body)}</p>
          </Link>
        ))}
      </div>
      <div className="grid widgets">
        <ShrinePreview />
        <EpicWidget />
      </div>
    </>
  );
}

export function SteamPage() {
  const { t } = useTranslation();
  usePageMeta(t("steam.title"));
  return (
    <>
      <h1>{t("steam.title")}</h1>
      <SteamWidget />
    </>
  );
}

export function FreeGamesPage() {
  const { t } = useTranslation();
  usePageMeta(t("epic.title"));
  return (
    <>
      <h1>{t("epic.title")}</h1>
      <EpicWidget detailed />
    </>
  );
}

export function OutlastPage() {
  const { t } = useTranslation();
  const status = outlastStatus();
  const [game, setGame] = useState<string | null>(null);
  usePageMeta(t("outlast.title"), t("outlast.lede"));
  useEffect(() => {
    const controller = new AbortController();
    loadSteam(controller.signal)
      .then((snapshot) => setGame(snapshot.currentGame))
      .catch(() => setGame(null));
    return () => controller.abort();
  }, []);
  return (
    <section className="card stack">
      <p className="eyebrow">{t("gaming.eyebrow")}</p>
      <h1>{t("outlast.title")}</h1>
      <p className="lede">{t("outlast.lede")}</p>
      <p>{t("outlast.noApi")}</p>
      <p>{t("outlast.noEmbed")}</p>
      <p>{t("outlast.noStats")}</p>
      {game ? <p>{t("outlast.steamContext", { game })}</p> : null}
      <p className="hint">{t("outlast.configure")}</p>
      <div className="row">
        <a className="cta" href={status.trackerUrl}>{t("outlast.tracker")}</a>
        {status.profileUrl ? <a className="text-btn" href={status.profileUrl}>{t("outlast.profile")}</a> : null}
        <a className="text-btn" href={profile.steamUrl}>{t("steam.visit")}</a>
      </div>
    </section>
  );
}
