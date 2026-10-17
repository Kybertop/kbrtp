import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { profile } from "../../config/profile";
import { usePreferences } from "../../prefs/PreferencesProvider";
import type { Preferences } from "../../prefs/storage";

const links = [
  ["/", "nav.home"],
  ["/projects", "nav.projects"],
  ["/resources", "nav.resources"],
  ["/gaming", "nav.gaming"],
  ["/guestbook", "nav.guestbook"]
] as const;

const languages: Array<{ id: Preferences["language"]; label: string }> = [
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
  { id: "ru", label: "Русский" },
  { id: "zh-CN", label: "简体中文" }
];

export function Shell() {
  const { t } = useTranslation();
  const { prefs, update } = usePreferences();
  const [open, setOpen] = useState(false);

  const languageSelect = (
    <label className="lang">
      <span className="sr">{t("nav.language")}</span>
      <select
        aria-label={t("nav.language")}
        value={prefs.language}
        onChange={(event) => update({ language: event.target.value as Preferences["language"] })}
      >
        {languages.map((language) => (
          <option key={language.id} value={language.id}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="shell">
      <a className="skip" href="#main">
        {t("nav.skip")}
      </a>
      <header className="nav">
        <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 32 24" aria-hidden="true">
            <path d="M2 16c0-7 4-12 10-12s10 5 10 12c0 3-2 5-5 5H7c-3 0-5-2-5-5z" fill="var(--lime)" stroke="currentColor" strokeWidth="1.6" />
            <path d="M6 14.5h12" stroke="#0c0c0c" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {profile.siteName}
        </NavLink>
        <nav className="nav-links" aria-label={t("nav.menu")}>
          {links.map(([to, key]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {t(key)}
            </NavLink>
          ))}
          <NavLink to="/settings">{t("nav.settings")}</NavLink>
        </nav>
        {languageSelect}
        <button className="menu-btn" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? t("nav.close") : t("nav.menu")}
        </button>
      </header>
      <div className={open ? "sheet open" : "sheet"}>
        {links.map(([to, key]) => (
          <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}>
            {t(key)}
          </NavLink>
        ))}
        <NavLink to="/settings" onClick={() => setOpen(false)}>
          {t("nav.settings")}
        </NavLink>
        {languageSelect}
      </div>
      <main id="main" className="main">
        <Outlet />
      </main>
      <footer className="foot">
        <div>
          <strong>{profile.identity}</strong>
          <p>{t("footer.note")}</p>
          <p>{t("footer.notAffiliated")}</p>
        </div>
        <div>
          <a href="/1/">{t("footer.archive")}</a>
          <p>
            <a href={profile.github}>GitHub</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
