import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { profile } from "../../config/profile";
import { formatDay, formatWhen, remainingParts } from "../../lib/format";
import { readCache, writeCache } from "../../lib/cache";
import { partitionEpic } from "../../lib/epicOffers";
import { usePreferences } from "../../prefs/PreferencesProvider";
import { loadEpic } from "../../providers/epic";
import { loadShrine, type ShrineModel } from "../../providers/dbd";
import { loadSteam, type SteamProfile } from "../../providers/steam";
import { loadForecast, reverseCity, searchCities, type City, type Forecast } from "../../providers/weather";
import { errorKey, errorText, LoadingBlock } from "../ui/feedback";

function Frame({ title, children, onRefresh, updated, source, live }: { title: string; children: ReactNode; onRefresh?: () => void; updated?: string | null; source?: string; live?: boolean }) {
  const { t, i18n } = useTranslation();
  return (
    <section className="widget" aria-labelledby={`widget-${title}`}>
      <header>
        <h2 id={`widget-${title}`}>{title}</h2>
        {onRefresh ? (
          <button className="text-btn" type="button" onClick={onRefresh}>
            {t("common.refresh")}
          </button>
        ) : null}
      </header>
      {children}
      <p className="meta">
        {live == null ? null : <span className="tag quiet">{live ? t("common.live") : t("common.cached")}</span>}{" "}
        {updated ? t("common.updated", { time: formatWhen(updated, i18n.language) }) : null}
        {source ? (
          <>
            {" "}
            <a href={source}>{t("common.source")}</a>
          </>
        ) : null}
      </p>
    </section>
  );
}

export function WeatherWidget() {
  const { t, i18n } = useTranslation();
  const { prefs, update } = usePreferences();
  const [city, setCity] = useState<City | null>(prefs.rememberWeather ? prefs.weatherCity : null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [issue, setIssue] = useState<string | null>(null);
  const [editing, setEditing] = useState(!city);

  useEffect(() => {
    if (!city) return;
    const key = `weather:${city.latitude}:${city.longitude}:${prefs.temperatureUnit}`;
    const cached = readCache<Forecast>(key, 20 * 60 * 1000);
    if (cached) {
      setForecast(cached.value);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    loadForecast(city, prefs.temperatureUnit, controller.signal)
      .then((value) => {
        setForecast(value);
        writeCache(key, value);
        setStatus("idle");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setIssue(errorKey(error));
      });
    return () => controller.abort();
  }, [city, prefs.temperatureUnit]);

  async function locate() {
    if (!navigator.geolocation) {
      setIssue("weather.denied");
      return;
    }
    setStatus("loading");
    setIssue(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const found = await reverseCity(position.coords.latitude, position.coords.longitude, i18n.language);
          setCity(found);
          setEditing(false);
          if (prefs.rememberWeather) update({ weatherCity: found });
          setIssue(null);
        } catch (error) {
          setStatus("error");
          setIssue(errorKey(error));
        }
      },
      () => {
        setStatus("idle");
        setIssue("weather.denied");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
    );
  }

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setStatus("loading");
    try {
      const cities = await searchCities(query.trim(), i18n.language);
      setResults(cities);
      setIssue(cities.length ? null : "weather.invalid");
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setIssue(errorKey(error));
    }
  }

  function choose(next: City) {
    setCity(next);
    setEditing(false);
    setResults([]);
    if (prefs.rememberWeather) update({ weatherCity: next });
  }

  const unit = prefs.temperatureUnit === "fahrenheit" ? "°F" : "°C";
  const windUnit = t(prefs.temperatureUnit === "fahrenheit" ? "weather.mph" : "weather.kmh");
  const precipUnit = t(prefs.temperatureUnit === "fahrenheit" ? "weather.inch" : "weather.mm");

  return (
    <Frame
      title={t("weather.title")}
      onRefresh={() => {
        if (!city) return;
        sessionStorage.removeItem(`weather:${city.latitude}:${city.longitude}:${prefs.temperatureUnit}`);
        setCity({ ...city });
      }}
      updated={forecast?.updatedAt}
      source="https://open-meteo.com/"
      live
    >
      {editing || !city ? (
        <form className="stack" onSubmit={onSearch}>
          <button className="text-btn" type="button" onClick={locate}>
            {t("weather.useLocation")}
          </button>
          <input className="field block" value={query} placeholder={t("weather.searchPlaceholder")} onChange={(event) => setQuery(event.target.value)} aria-label={t("weather.searchPlaceholder")} />
          <label className="meta">
            <input type="checkbox" checked={prefs.rememberWeather} onChange={(event) => update({ rememberWeather: event.target.checked, weatherCity: event.target.checked ? city : null })} /> {t("weather.remember")}
          </label>
          <ul className="list">
            {results.map((item) => (
              <li key={`${item.id}-${item.latitude}`}>
                <button className="text-btn" type="button" onClick={() => choose(item)}>
                  {item.name}
                  {item.admin1 ? `, ${item.admin1}` : ""} {item.country ? `· ${item.country}` : ""}
                </button>
              </li>
            ))}
          </ul>
        </form>
      ) : null}
      {status === "loading" ? <LoadingBlock /> : null}
      {issue ? <p className="error">{t(issue)}</p> : null}
      {forecast && city && !editing ? (
        <div className="stack">
          <p className="meta">
            {city.name}
            {city.country ? ` · ${city.country}` : ""}
          </p>
          <p className="stat">
            {Math.round(forecast.temperature)}
            {unit}
          </p>
          <p>{t(`weather.wmo.${forecast.code}`, { defaultValue: t("weather.wmo.unknown") })}</p>
          <p className="meta">
            {t("weather.feels")} {Math.round(forecast.apparent)}
            {unit} · {t("weather.wind")} {Math.round(forecast.wind)} {windUnit} · {t("weather.precip")} {forecast.precipitation} {precipUnit}
          </p>
          <p className="meta">
            {t("weather.high")} {Math.round(forecast.days[0]?.high ?? 0)}
            {unit} · {t("weather.low")} {Math.round(forecast.days[0]?.low ?? 0)}
            {unit}
          </p>
          <ul className="list">
            {forecast.days.slice(1, 4).map((day) => (
              <li key={day.date} className="meta">
                {formatDay(day.date, i18n.language)} · {t(`weather.wmo.${day.code}`, { defaultValue: t("weather.wmo.unknown") })} · {Math.round(day.low)}–{Math.round(day.high)}
                {unit}
              </li>
            ))}
          </ul>
          <button className="text-btn" type="button" onClick={() => setEditing(true)}>
            {t("weather.change")}
          </button>
          <p className="hint">{t("weather.privacy")}</p>
          <a href="https://open-meteo.com/">Weather data by Open-Meteo.com</a>
        </div>
      ) : null}
    </Frame>
  );
}

export function SteamWidget({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const [profileData, setProfileData] = useState<SteamProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    loadSteam(controller.signal)
      .then((value) => {
        setProfileData(value);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(errorText(error, t));
      });
    return () => controller.abort();
  }, [nonce, t]);

  async function copyName() {
    await navigator.clipboard.writeText(profile.discordUsername);
    setCopied(true);
  }

  return (
    <Frame title={t("steam.title")} onRefresh={() => setNonce((value) => value + 1)} updated={profileData?.fetchedAt} source={profile.steamUrl} live={false}>
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      {profileData ? (
        <div className="stack">
          <img src={profileData.avatar} alt="" width={72} height={72} style={{ width: 72, height: 72, borderRadius: 12 }} />
          <strong>{profileData.name}</strong>
          <p className="hint">{t("steam.snapshot")}</p>
          {profileData.memberSince ? (
            <p className="meta">
              {t("steam.member")} {profileData.memberSince}
            </p>
          ) : null}
          <p>{profileData.currentGame ? `${t("steam.game")}: ${profileData.currentGame}` : t("steam.noGame")}</p>
          {profileData.hoursPlayed2Wk != null ? (
            <p className="meta">
              {t("steam.hours")}: {profileData.hoursPlayed2Wk}
            </p>
          ) : null}
          {!compact && profileData.recentGames ? (
            <ul className="list">
              {profileData.recentGames.map((game) => (
                <li key={game.appId}>
                  {game.name}
                  {game.playtime2Weeks != null ? ` · ${t("steam.minutes", { count: game.playtime2Weeks })}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {!compact && !profileData.recentGames ? <p className="hint">{t("steam.recentMissing")}</p> : null}
          <a href={profileData.profileUrl}>{t("steam.visit")}</a>
          <p className="meta">{formatWhen(profileData.fetchedAt, i18n.language)}</p>
        </div>
      ) : null}
      <div className="stack">
        <h3>{t("discord.title")}</h3>
        <p>
          {t("discord.username")}: <strong>{profile.discordUsername}</strong>
        </p>
        <button className="text-btn" type="button" onClick={copyName}>
          {copied ? t("common.copied") : t("discord.copy")}
        </button>
        {profile.discordInviteUrl ? <a href={profile.discordInviteUrl}>{t("discord.invite")}</a> : null}
        {profile.discordProfileUrl ? <a href={profile.discordProfileUrl}>{t("common.open")}</a> : <p className="hint">{t("discord.noProfile")}</p>}
        <p className="hint">{t("discord.note")}</p>
      </div>
    </Frame>
  );
}

export function EpicWidget({ detailed = false }: { detailed?: boolean }) {
  const { t, i18n } = useTranslation();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadEpic>> | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [message, setMessage] = useState("");
  const [nonce, setNonce] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    loadEpic(controller.signal)
      .then((value) => {
        setSnapshot(value);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(errorText(error, t));
      });
    return () => controller.abort();
  }, [nonce, t]);

  const groups = useMemo(() => (snapshot ? partitionEpic(snapshot, now) : null), [snapshot, now]);

  return (
    <Frame title={t("epic.title")} onRefresh={() => setNonce((value) => value + 1)} updated={snapshot?.fetchedAt} source="https://store.epicgames.com/en-US/free-games" live={false}>
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      {groups ? (
        <div className="stack">
          <p className="hint">{t("epic.snapshot")}</p>
          <h3>{t("epic.current")}</h3>
          {groups.current.length === 0 ? <p>{t("epic.noneCurrent")}</p> : null}
          {groups.current.slice(0, detailed ? 8 : 2).map((game) => (
            <GameRow key={game.id} game={game} now={now} />
          ))}
          {detailed ? (
            <>
              <h3>{t("epic.upcoming")}</h3>
              {groups.upcoming.length === 0 ? <p>{t("epic.noneUpcoming")}</p> : null}
              {groups.upcoming.map((game) => (
                <GameRow key={game.id} game={game} now={now} upcoming />
              ))}
              <h3>{t("epic.freeToPlay")}</h3>
              {groups.freeToPlay.length === 0 ? <p className="hint">{t("common.empty")}</p> : null}
              {groups.freeToPlay.map((game) => (
                <article key={game.id}>
                  <strong>{game.title}</strong>
                  <p className="hint">{t("epic.permanent")}</p>
                  <a href={game.url}>{t("epic.store")}</a>
                </article>
              ))}
            </>
          ) : (
            <Link to="/gaming/free">{t("common.details")}</Link>
          )}
          <p className="meta">{formatWhen(snapshot?.fetchedAt, i18n.language)}</p>
        </div>
      ) : null}
    </Frame>
  );
}

function GameRow({ game, now, upcoming = false }: { game: { id: string; title: string; image: string | null; url: string; end: string | null; start: string | null; originalPrice: string | null }; now: number; upcoming?: boolean }) {
  const { t, i18n } = useTranslation();
  const stamp = upcoming ? game.start : game.end;
  const left = game.end ? remainingParts(game.end, now) : null;
  return (
    <article className="stack">
      {game.image ? <img src={game.image} alt="" /> : null}
      <strong>{game.title}</strong>
      {game.originalPrice ? <p className="meta">{game.originalPrice}</p> : null}
      {stamp ? <p className="meta">{t(upcoming ? "epic.starts" : "epic.ends", { time: formatWhen(stamp, i18n.language) })}</p> : null}
      {!upcoming && left && !left.expired ? <p>{t("epic.left", left)}</p> : null}
      {!upcoming && left?.expired ? <p>{t("epic.ended")}</p> : null}
      <a href={game.url}>{t("epic.store")}</a>
    </article>
  );
}

export function ShrinePreview({ detailed = false }: { detailed?: boolean }) {
  const { t, i18n } = useTranslation();
  const [shrine, setShrine] = useState<ShrineModel | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [message, setMessage] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    loadShrine(controller.signal)
      .then((value) => {
        setShrine(value);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(errorText(error, t));
      });
    return () => controller.abort();
  }, [nonce, t]);

  return (
    <Frame title={t("dbd.shrine")} onRefresh={() => setNonce((value) => value + 1)} updated={shrine?.fetchedAt} source={shrine?.page} live={shrine?.live}>
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      {shrine && !shrine.live ? <p className="hint">{t("dbd.fallback")}</p> : null}
      {shrine ? (
        <div className="stack">
          <p className="meta">
            {t("dbd.reset")} {formatWhen(shrine.end, i18n.language)}
          </p>
          <ul className="list">
            {shrine.perks.slice(0, detailed ? 4 : 4).map((perk) => (
              <li key={perk.id}>
                <strong>{perk.name}</strong>
                <p className="meta">
                  {perk.character} · {perk.role ? t(perk.role === "killer" ? "dbd.killer" : "dbd.survivor") : ""} · {perk.shards != null ? t("dbd.shards", { count: perk.shards }) : ""}
                </p>
              </li>
            ))}
          </ul>
          <a href={shrine.page}>{t("dbd.nightlight")}</a>
          {!detailed ? <Link to="/gaming/dbd">{t("common.details")}</Link> : null}
        </div>
      ) : null}
    </Frame>
  );
}
