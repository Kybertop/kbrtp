import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { giscus } from "../config/giscus";
import { usePageMeta } from "./meta";

const giscusLang: Record<string, string> = { en: "en", ja: "ja", ru: "ru", "zh-CN": "zh-CN" };

export function GuestbookPage() {
  const { t, i18n } = useTranslation();
  const slot = useRef<HTMLDivElement>(null);
  usePageMeta(t("guestbook.title"), t("guestbook.lede"));
  const ready = Boolean(giscus.categoryId);

  useEffect(() => {
    const host = slot.current;
    if (!host || !ready) return;
    host.replaceChildren();
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", giscus.repo);
    script.setAttribute("data-repo-id", giscus.repoId);
    script.setAttribute("data-category", giscus.category);
    script.setAttribute("data-category-id", giscus.categoryId);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", giscus.term);
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", new URL("/giscus.css", window.location.origin).href);
    script.setAttribute("data-lang", giscusLang[i18n.language] ?? "en");
    host.appendChild(script);
    return () => host.replaceChildren();
  }, [i18n.language, ready]);

  return (
    <>
      <p className="eyebrow">{t("guestbook.eyebrow")}</p>
      <h1>{t("guestbook.title")}</h1>
      <p className="lede">{t("guestbook.lede")}</p>
      {ready ? <div ref={slot} /> : (
        <section className="card stack">
          <h2>{t("guestbook.setupTitle")}</h2>
          <p>{t("guestbook.setupBody")}</p>
          <ol>
            <li>{t("guestbook.stepDiscussions")}</li>
            <li>{t("guestbook.stepInstall")}</li>
            <li>{t("guestbook.stepCategory")}</li>
          </ol>
          <p>{t("guestbook.missing")}</p>
        </section>
      )}
    </>
  );
}
