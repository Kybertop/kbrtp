import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decodeBuild, encodeBuild, rollBuild, type PerkRecord } from "../../lib/dbdBuild";
import { formatWhen } from "../../lib/format";
import { loadFavorites, saveFavorites, type FavoriteBuild } from "../../prefs/storage";
import { usePreferences } from "../../prefs/PreferencesProvider";
import { loadPerkDataset, type PerkDataset } from "../../providers/dbd";
import { errorText, LoadingBlock } from "../../components/ui/feedback";
import { ShrinePreview } from "../../components/widgets/Widgets";
import { usePageMeta } from "../meta";

export function DbdShrinePage() {
  const { t } = useTranslation();
  usePageMeta(t("dbd.shrine"));
  return (
    <>
      <p className="eyebrow">{t("dbd.title")}</p>
      <h1>{t("dbd.shrine")}</h1>
      <ShrinePreview detailed />
    </>
  );
}

const challenges = [
  { id: "aura", mode: "survivor" as const, category: "perception" },
  { id: "chase", mode: "survivor" as const, category: "chasing" },
  { id: "tracking", mode: "killer" as const, category: "tracking" },
  { id: "teachable", mode: "survivor" as const, category: null }
];

export function DbdBuildsPage() {
  const { t } = useTranslation();
  const { prefs, update } = usePreferences();
  const [params, setParams] = useSearchParams();
  const initial = decodeBuild(params.toString());
  usePageMeta(t("dbd.builds"));
  const [dataset, setDataset] = useState<PerkDataset | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"survivor" | "killer">(initial.mode);
  const [killerId, setKillerId] = useState<string | null>(initial.killerId);
  const [perkIds, setPerkIds] = useState<Array<string | null>>(initial.perks);
  const [locks, setLocks] = useState<boolean[]>(initial.locks);
  const [favorites, setFavorites] = useState<FavoriteBuild[]>(() => loadFavorites());
  const [perkQuery, setPerkQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadPerkDataset(controller.signal)
      .then((value) => {
        setDataset(value);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(errorText(error, t));
      });
    return () => controller.abort();
  }, [t]);

  const killers = dataset?.characters.filter((character) => character.role === "killer") ?? [];
  const byId = useMemo(() => new Map(dataset?.perks.map((perk) => [perk.id, perk]) ?? []), [dataset]);

  function generate(category?: string | null, nextMode = mode, nextKiller = killerId) {
    if (!dataset) return;
    const rolled = rollBuild(dataset.perks, {
      mode: nextMode,
      killerId: nextMode === "killer" ? nextKiller : null,
      locked: perkIds.map((id, index) => (locks[index] ? id : null)),
      excluded: prefs.excludedPerks,
      ownedOnly: prefs.dbdOwnedOnly,
      ownedCharacters: prefs.ownedCharacters,
      category
    });
    setPerkIds(rolled);
    if (rolled.some((id) => !id)) setNotice(t("dbd.noPerks"));
    else setNotice("");
  }

  function challenge() {
    if (!dataset) return;
    const pick = challenges[Math.floor(Math.random() * challenges.length)];
    let nextKiller = killerId;
    if (pick.id === "teachable") {
      const pool = dataset.characters.filter((character) => character.role === "survivor");
      const character = pool[Math.floor(Math.random() * pool.length)];
      const teachables = dataset.perks.filter((perk) => perk.characterId === character?.id).slice(0, 4);
      const general = dataset.perks.filter((perk) => perk.role === "survivor" && !perk.characterId && !teachables.some((item) => item.id === perk.id));
      const ids = [...teachables.map((perk) => perk.id)];
      while (ids.length < 4 && general.length) ids.push(general.splice(Math.floor(Math.random() * general.length), 1)[0].id);
      setMode("survivor");
      setLocks([false, false, false, false]);
      setPerkIds([ids[0] ?? null, ids[1] ?? null, ids[2] ?? null, ids[3] ?? null]);
      setNotice(t("challenges.teachable"));
      return;
    }
    if (pick.mode === "killer" && !nextKiller) {
      nextKiller = killers[Math.floor(Math.random() * killers.length)]?.id ?? null;
      setKillerId(nextKiller);
    }
    setMode(pick.mode);
    setNotice(`${t("dbd.challenge")}: ${t(`challenges.${pick.id}`)}`);
    const rolled = rollBuild(dataset.perks, {
      mode: pick.mode,
      killerId: pick.mode === "killer" ? nextKiller : null,
      locked: [null, null, null, null],
      excluded: prefs.excludedPerks,
      ownedOnly: prefs.dbdOwnedOnly,
      ownedCharacters: prefs.ownedCharacters,
      category: pick.category
    });
    setLocks([false, false, false, false]);
    setPerkIds(rolled);
  }

  function share() {
    const search = encodeBuild({ mode, perks: perkIds, locks, killerId });
    setParams(new URLSearchParams(search));
    void navigator.clipboard.writeText(`${window.location.origin}/gaming/dbd/builds?${search}`);
    setNotice(t("common.copied"));
  }

  async function copyBuild() {
    const lines = perkIds.map((id, index) => {
      const perk = id ? byId.get(id) : undefined;
      return perk ? `${index + 1}. ${perk.name} — ${perk.description}` : `${index + 1}. —`;
    });
    const killer = killers.find((item) => item.id === killerId);
    const text = [`${t(mode === "killer" ? "dbd.killer" : "dbd.survivor")}${killer ? ` · ${killer.name}` : ""}`, ...lines].join("\n");
    await navigator.clipboard.writeText(text);
    setNotice(t("common.copied"));
  }

  function saveBuild() {
    const next = [{ id: crypto.randomUUID(), mode, perkIds: perkIds.filter((id): id is string => Boolean(id)), killerId, createdAt: new Date().toISOString() }, ...favorites].slice(0, 20);
    setFavorites(next);
    saveFavorites(next);
  }

  const libraryMatches = (dataset?.perks ?? []).filter((perk) => {
    const needle = perkQuery.trim().toLowerCase();
    if (!needle) return false;
    return perk.name.toLowerCase().includes(needle) || perk.id.toLowerCase().includes(needle);
  }).slice(0, 8);

  return (
    <>
      <p className="eyebrow">{t("dbd.title")}</p>
      <h1>{t("dbd.builds")}</h1>
      {dataset ? <p className="hint">{t("dbd.dataset", { version: dataset.version })} · {dataset.note}</p> : null}
      <div className="filters">
        <button className="text-btn" type="button" aria-pressed={mode === "survivor"} onClick={() => { setMode("survivor"); setLocks([false, false, false, false]); }}>{t("dbd.survivor")}</button>
        <button className="text-btn" type="button" aria-pressed={mode === "killer"} onClick={() => { setMode("killer"); setLocks([false, false, false, false]); }}>{t("dbd.killer")}</button>
        {mode === "killer" ? (
          <select className="select" value={killerId ?? ""} aria-label={t("dbd.killer")} onChange={(event) => setKillerId(event.target.value || null)}>
            <option value="">{t("dbd.randomKiller")}</option>
            {killers.map((killer) => <option key={killer.id} value={killer.id}>{killer.name}</option>)}
          </select>
        ) : null}
        <button className="cta" type="button" onClick={() => generate()}>{t("dbd.reroll")}</button>
        <button className="text-btn" type="button" onClick={challenge}>{t("dbd.challenge")}</button>
      </div>
      <p className="hint">{t("dbd.challengeNote")}</p>
      <label>
        <input type="checkbox" checked={prefs.dbdOwnedOnly} onChange={(event) => update({ dbdOwnedOnly: event.target.checked })} /> {t("dbd.ownedOnly")}
      </label>
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      <div className="grid perks">
        {perkIds.map((id, index) => {
          const perk = id ? byId.get(id) : undefined;
          return (
            <article className={locks[index] ? "card locked" : "card"} key={index}>
              <PerkFace perk={perk} />
              <h2>{perk?.name ?? "—"}</h2>
              <p>{perk?.description}</p>
              <p className="meta">{perk?.characterName ?? t("dbd.general")}</p>
              <button className="text-btn" type="button" aria-pressed={locks[index]} onClick={() => setLocks((current) => current.map((locked, slot) => (slot === index ? !locked : locked)))}>
                {locks[index] ? t("common.unlock") : t("common.lock")}
              </button>
            </article>
          );
        })}
      </div>
      <div className="row">
        <button className="text-btn" type="button" onClick={copyBuild}>{t("dbd.copyBuild")}</button>
        <button className="text-btn" type="button" onClick={share}>{t("common.share")}</button>
        <button className="text-btn" type="button" onClick={saveBuild}>{t("dbd.saveFavorite")}</button>
      </div>
      {notice ? <p>{notice}</p> : null}
      <h2>{t("dbd.favorites")}</h2>
      {favorites.length === 0 ? <p>{t("dbd.emptyFavorites")}</p> : null}
      <ul className="list">
        {favorites.map((favorite) => (
          <li key={favorite.id}>
            <button className="text-btn" type="button" onClick={() => { setMode(favorite.mode); setKillerId(favorite.killerId); setPerkIds([...favorite.perkIds, null, null, null, null].slice(0, 4)); setLocks([false, false, false, false]); }}>
              {t(favorite.mode === "killer" ? "dbd.killer" : "dbd.survivor")} · {favorite.perkIds.map((id) => byId.get(id)?.name ?? id).join(", ")}
            </button>
            <button className="text-btn" type="button" onClick={() => { const next = favorites.filter((item) => item.id !== favorite.id); setFavorites(next); saveFavorites(next); }}>{t("common.remove")}</button>
          </li>
        ))}
      </ul>
      <h2>{t("dbd.exclude")}</h2>
      <input className="field" value={perkQuery} onChange={(event) => setPerkQuery(event.target.value)} placeholder={t("dbd.searchPerks")} aria-label={t("dbd.searchPerks")} />
      <ul className="list">
        {libraryMatches.map((perk) => (
          <li key={perk.id}>
            <button className="text-btn" type="button" onClick={() => update({ excludedPerks: prefs.excludedPerks.includes(perk.id) ? prefs.excludedPerks.filter((id) => id !== perk.id) : [...prefs.excludedPerks, perk.id] })}>
              {prefs.excludedPerks.includes(perk.id) ? t("common.remove") : t("dbd.exclude")} {perk.name}
            </button>
          </li>
        ))}
      </ul>
      {prefs.excludedPerks.length ? <p className="meta">{t("dbd.excluded")}: {prefs.excludedPerks.map((id) => byId.get(id)?.name ?? id).join(", ")}</p> : null}
      <h2>{t("dbd.ownedOnly")}</h2>
      <div className="filters">
        {(dataset?.characters ?? []).map((character) => (
          <button key={character.id} className="text-btn" type="button" aria-pressed={prefs.ownedCharacters.includes(character.id)} onClick={() => update({ ownedCharacters: prefs.ownedCharacters.includes(character.id) ? prefs.ownedCharacters.filter((id) => id !== character.id) : [...prefs.ownedCharacters, character.id] })}>
            {character.name}
          </button>
        ))}
      </div>
    </>
  );
}

function PerkFace({ perk }: { perk?: PerkRecord }) {
  const [failed, setFailed] = useState(false);
  if (!perk) return <div className="fallback">?</div>;
  if (!perk.image || failed) return <div className="fallback">{perk.name.slice(0, 1)}</div>;
  return <img src={perk.image} alt="" onError={() => setFailed(true)} />;
}

export function DbdPerksPage() {
  const { t, i18n } = useTranslation();
  usePageMeta(t("dbd.perks"));
  const [dataset, setDataset] = useState<PerkDataset | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | "survivor" | "killer">("all");
  const [character, setCharacter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    loadPerkDataset(controller.signal)
      .then((value) => {
        setDataset(value);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(errorText(error, t));
      });
    return () => controller.abort();
  }, [t]);

  const visible = (dataset?.perks ?? []).filter((perk) => {
    const needle = query.trim().toLowerCase();
    const roleOk = role === "all" || perk.role === role;
    const characterOk = character === "all" || perk.characterId === character || (character === "general" && !perk.characterId);
    const text = `${perk.name} ${perk.description}`.toLowerCase();
    return roleOk && characterOk && (!needle || text.includes(needle));
  }).slice(0, 60);

  return (
    <>
      <p className="eyebrow">{t("dbd.title")}</p>
      <h1>{t("dbd.perks")}</h1>
      <p className="lede">{t("dbd.library")}</p>
      {dataset ? <p className="hint">{t("dbd.dataset", { version: dataset.version })} · {formatWhen(dataset.fetchedAt, i18n.language)} · <a href={dataset.source}>{t("common.source")}</a></p> : null}
      <p className="hint">{t("dbd.description")}</p>
      <div className="filters">
        <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("dbd.searchPerks")} aria-label={t("dbd.searchPerks")} />
        <select className="select" value={role} aria-label={t("dbd.role")} onChange={(event) => setRole(event.target.value as typeof role)}>
          <option value="all">{t("common.all")}</option>
          <option value="survivor">{t("dbd.survivor")}</option>
          <option value="killer">{t("dbd.killer")}</option>
        </select>
        <select className="select" value={character} aria-label={t("dbd.filterCharacter")} onChange={(event) => setCharacter(event.target.value)}>
          <option value="all">{t("dbd.anyCharacter")}</option>
          <option value="general">{t("dbd.general")}</option>
          {(dataset?.characters ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      {status === "loading" ? <LoadingBlock /> : null}
      {status === "error" ? <p className="error">{message}</p> : null}
      <div className="grid perks">
        {visible.map((perk) => (
          <article className="card" key={perk.id}>
            <PerkFace perk={perk} />
            <h2>{perk.name}</h2>
            <p className="meta">{t(perk.role === "killer" ? "dbd.killer" : "dbd.survivor")} · {perk.characterName ?? t("dbd.general")}</p>
            <p>{perk.description}</p>
          </article>
        ))}
      </div>
    </>
  );
}

