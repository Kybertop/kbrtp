import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { resources } from "../content/resources";
import { usePageMeta } from "./meta";

export function ResourcesPage() {
  const { t } = useTranslation();
  usePageMeta(t("resources.title"), t("resources.lede"));
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("all");
  const tags = ["all", "weather", "gaming", "data", "community", "archive"];
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter((item) => {
      const text = `${item.title} ${t(item.bodyKey)} ${item.tags.join(" ")}`.toLowerCase();
      const tagOk = tag === "all" || item.tags.includes(tag as (typeof item.tags)[number]);
      return tagOk && (!needle || text.includes(needle));
    });
  }, [query, tag, t]);

  return (
    <>
      <p className="eyebrow">{t("resources.eyebrow")}</p>
      <h1>{t("resources.title")}</h1>
      <p className="lede">{t("resources.lede")}</p>
      <div className="filters">
        <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("resources.search")} aria-label={t("resources.search")} />
        {tags.map((item) => (
          <button key={item} className="text-btn" type="button" aria-pressed={tag === item} onClick={() => setTag(item)}>
            {item === "all" ? t("resources.all") : item}
          </button>
        ))}
      </div>
      <ul className="list">
        {visible.map((item) => (
          <li key={item.id} className="resource">
            <a href={item.href}>
              <strong>{item.title}</strong>
              <span>{t(item.bodyKey)}</span>
            </a>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? <p>{t("resources.empty")}</p> : null}
    </>
  );
}
