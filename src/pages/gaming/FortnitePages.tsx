import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { readCache, writeCache } from "../../lib/cache";
import { formatDay, formatWhen } from "../../lib/format";
import { usePreferences } from "../../prefs/PreferencesProvider";
import { loadShop, rareReturns, repriceAbsence, searchCosmetics, type RareReturn, type ShopModel, type ShopOffer } from "../../providers/fortnite";
import { errorText, LoadingBlock } from "../../components/ui/feedback";
import { usePageMeta } from "../meta";

const rarityRank: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
  exotic: 7,
  icon: 8,
  gaminglegends: 8,
  marvel: 8,
  dc: 8,
  starwars: 8
};

function useShop() {
  const { i18n, t } = useTranslation();
  const { prefs } = usePreferences();
  const [shop, setShop] = useState<ShopModel | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [message, setMessage] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const key = `fn-shop:${i18n.language}`;
    if (nonce === 0) {
      const cached = readCache<ShopModel>(key, 30 * 60 * 1000);
      if (cached) {
        setShop(cached.value);
        setStatus("ready");
        return;
      }
    }
    const controller = new AbortController();
    setStatus("loading");
    loadShop(i18n.language, prefs.rareReturnDays, controller.signal)
      .then((value) => {
        setShop(value);
        writeCache(key, value);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(errorText(error, t));
      });
    return () => controller.abort();
      // Threshold changes are applied locally in repriceAbsence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, nonce, t]);

  const view = shop ? repriceAbsence(shop, prefs.rareReturnDays) : null;
  return { shop: view, status, message, reload: () => setNonce((value) => value + 1) };
}

export function FortniteShopPage() {
  const { t, i18n } = useTranslation();
  const { shop, status, message, reload } = useShop();
  usePageMeta(t("fortnite.shop"));
  const [section, setSection] = useState("all");
  const [sort, setSort] = useState<"name" | "price" | "rarity">("name");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ShopOffer | null>(null);
  const sections = useMemo(() => [...new Set((shop?.offers ?? []).map((offer) => offer.section).filter(Boolean))].sort(), [shop]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (shop?.offers ?? []).filter((offer) => {
      const inSection = section === "all" || offer.section === section;
      const text = `${offer.name} ${offer.items.map((item) => item.name).join(" ")}`.toLowerCase();
      return inSection && (!needle || text.includes(needle));
    });
    list.sort((a, b) => {
      if (sort === "price") return (a.price ?? -1) - (b.price ?? -1);
      if (sort === "rarity") return (rarityRank[b.items[0]?.rarityValue] ?? 0) - (rarityRank[a.items[0]?.rarityValue] ?? 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [shop, section, sort, query]);
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <>
      <header className="row">
        <div>
          <p className="eyebrow">{t("fortnite.title")}</p>
          <h1>{t("fortnite.shop")}</h1>
          {shop ? <p className="meta">{t("fortnite.date")} {formatDay(shop.date, i18n.language)}</p> : null}
        </div>
        <button className="text-btn" type="button" onClick={reload}>{t("common.refresh")}</button>
      </header>
      <p className="hint">{t("fortnite.source")} {shop ? <span className="tag quiet">{shop.fallbackLanguage ? t("common.fallback") : t("common.live")}</span> : null}</p>
      {shop ? <p className="meta">{t("common.updated", { time: formatWhen(shop.fetchedAt, i18n.language) })}</p> : null}
      <div className="filters">
        <input className="field" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder={t("common.search")} aria-label={t("common.search")} />
        <select className="select" value={section} aria-label={t("fortnite.section")} onChange={(event) => { setSection(event.target.value); setPage(0); }}>
          <option value="all">{t("fortnite.allSections")}</option>
          {sections.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="select" value={sort} aria-label={t("fortnite.sortName")} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="name">{t("fortnite.sortName")}</option>
          <option value="price">{t("fortnite.sortPrice")}</option>
          <option value="rarity">{t("fortnite.sortRarity")}</option>
        </select>
      </div>
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      <div className="grid shop">
        {visible.map((offer) => (
          <article className="card item" key={offer.id}>
            {offer.image ? <img src={offer.image} alt="" /> : <div className="fallback">{offer.name.slice(0, 1)}</div>}
            <h2>{offer.name}</h2>
            <p className="meta">{offer.kind === "bundle" ? t("fortnite.bundle") : offer.items[0]?.type} · {offer.section}</p>
            <p>{offer.price != null ? t("fortnite.price", { count: offer.price }) : t("fortnite.included")}</p>
            <button className="text-btn" type="button" onClick={() => setSelected(offer)}>{t("common.details")}</button>
          </article>
        ))}
      </div>
      {status === "ready" && filtered.length === 0 ? <p>{t("fortnite.empty")}</p> : null}
      <div className="pager">
        <button className="text-btn" type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>{t("common.previous")}</button>
        <span>{t("common.page", { page: page + 1 })} / {pages}</span>
        <button className="text-btn" type="button" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)}>{t("common.next")}</button>
      </div>
      {selected ? <OfferDialog offer={selected} shopDate={shop?.date ?? ""} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function OfferDialog({ offer, shopDate, onClose }: { offer: ShopOffer; shopDate: string; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="dialog-wrap" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={offer.name} onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{offer.name}</h2>
          <button className="text-btn" type="button" onClick={onClose}>{t("common.close")}</button>
        </header>
        {offer.image ? <img src={offer.image} alt="" /> : null}
        <p>{offer.price != null ? t("fortnite.price", { count: offer.price }) : t("fortnite.included")}</p>
        <ul className="list">
          {offer.items.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <p className="meta">{item.type} · {item.rarity} · <span className="tag">{t(`fortnite.${item.absence.status === "rare" ? "rare" : item.absence.status}`)}</span></p>
              {item.absence.previous ? <p className="meta">{t("fortnite.previous")} {formatDay(item.absence.previous, i18n.language)} · {t("fortnite.absent", { count: item.absence.absentDays ?? 0 })}</p> : null}
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
        {shopDate ? <p className="meta">{t("fortnite.returnDate")} {formatDay(shopDate, i18n.language)}</p> : null}
        <a href="https://www.fortnite.com/item-shop">{t("fortnite.shopLink")}</a>
      </div>
    </div>
  );
}

export function RareReturnsPage() {
  const { t, i18n } = useTranslation();
  const { prefs, update } = usePreferences();
  const { shop, status, message, reload } = useShop();
  usePageMeta(t("fortnite.returns"));
  const [sort, setSort] = useState<"longest" | "shortest" | "name" | "type">("longest");
  const items = useMemo(() => {
    const list = shop ? rareReturns(shop) : [];
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "type") return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      if (sort === "shortest") return (a.absence.absentDays ?? 0) - (b.absence.absentDays ?? 0);
      return (b.absence.absentDays ?? 0) - (a.absence.absentDays ?? 0);
    });
    return list;
  }, [shop, sort]);

  return (
    <>
      <p className="eyebrow">{t("fortnite.title")}</p>
      <h1>{t("fortnite.returns")}</h1>
      <div className="filters">
        <label>
          {t("fortnite.threshold")}
          <input className="field" type="number" min={1} max={5000} value={prefs.rareReturnDays} onChange={(event) => update({ rareReturnDays: Number(event.target.value) || 300 })} />
        </label>
        <select className="select" value={sort} aria-label={t("fortnite.sortLongest")} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="longest">{t("fortnite.sortLongest")}</option>
          <option value="shortest">{t("fortnite.sortShortest")}</option>
          <option value="name">{t("fortnite.sortName")}</option>
          <option value="type">{t("fortnite.sortType")}</option>
        </select>
        <button className="text-btn" type="button" onClick={reload}>{t("common.refresh")}</button>
      </div>
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      {status === "ready" && items.length === 0 ? <p>{t("fortnite.noRare")}</p> : null}
      <div className="grid shop">
        {items.map((item) => <RareCard key={item.id} item={item} shopDate={shop?.date ?? ""} />)}
      </div>
      <p className="hint">{t("fortnite.source")}</p>
      <p className="meta">{shop ? formatWhen(shop.fetchedAt, i18n.language) : ""}</p>
    </>
  );
}

function RareCard({ item, shopDate }: { item: RareReturn; shopDate: string }) {
  const { t, i18n } = useTranslation();
  return (
    <article className="card">
      {item.image ? <img src={item.image} alt="" /> : <div className="fallback">{item.name.slice(0, 1)}</div>}
      <h2>{item.name}</h2>
      <p><span className="tag">{t("fortnite.rare")}</span> <span className="tag quiet">{item.type}</span></p>
      <p>{t("fortnite.absent", { count: item.absence.absentDays ?? 0 })}</p>
      <p className="meta">{t("fortnite.previous")} {item.absence.previous ? formatDay(item.absence.previous, i18n.language) : "—"}</p>
      <p className="meta">{t("fortnite.returnDate")} {shopDate ? formatDay(shopDate, i18n.language) : "—"}</p>
      <p>{item.price != null ? t("fortnite.price", { count: item.price }) : t("fortnite.included")}</p>
      <p className="meta">{item.rarity}</p>
    </article>
  );
}

export function FortniteSearchPage() {
  const { t, i18n } = useTranslation();
  usePageMeta(t("fortnite.search"));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchCosmetics>>>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      searchCosmetics(query.trim(), i18n.language, controller.signal)
        .then((value) => {
          setResults(value);
          setStatus("ready");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setStatus("error");
          setMessage(errorText(error, t));
        });
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, i18n.language, t]);

  return (
    <>
      <p className="eyebrow">{t("fortnite.title")}</p>
      <h1>{t("fortnite.search")}</h1>
      <input className="field block" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("fortnite.query")} aria-label={t("fortnite.query")} />
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      {status === "ready" && results.length === 0 ? <p>{t("fortnite.empty")}</p> : null}
      <div className="grid shop">
        {results.slice(0, 40).map((item) => (
          <article className="card" key={item.id}>
            {item.image ? <img src={item.image} alt="" /> : <div className="fallback">{item.name.slice(0, 1)}</div>}
            <h2>{item.name}</h2>
            <p className="meta">{item.type} · {item.rarity}</p>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
      <p className="hint">{t("fortnite.source")}</p>
    </>
  );
}
