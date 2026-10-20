export type PerkRecord = {
  id: string;
  name: string;
  role: "survivor" | "killer";
  characterId: string | null;
  characterName: string | null;
  categories: string[];
  description: string;
  image: string | null;
};

export type BuildRequest = {
  mode: "survivor" | "killer";
  killerId: string | null;
  locked: Array<string | null>;
  excluded: string[];
  ownedOnly: boolean;
  ownedCharacters: string[];
  category?: string | null;
  rng?: () => number;
};

export function isCompatible(perk: PerkRecord, request: BuildRequest) {
  if (perk.role !== request.mode) return false;
  if (request.category && !perk.categories.includes(request.category)) return false;
  if (request.mode === "killer" && request.killerId && perk.characterId && perk.characterId !== request.killerId) {
    return false;
  }
  if (request.ownedOnly && perk.characterId && !request.ownedCharacters.includes(perk.characterId)) return false;
  return true;
}

export function rollBuild(perks: PerkRecord[], request: BuildRequest) {
  const rng = request.rng ?? Math.random;
  const locked = [...request.locked].slice(0, 4);
  while (locked.length < 4) locked.push(null);
  const byId = new Map(perks.map((perk) => [perk.id, perk]));
  const kept = locked.map((id) => {
    const perk = id ? byId.get(id) : undefined;
    if (!perk || request.excluded.includes(perk.id) || !isCompatible(perk, request)) return null;
    return perk.id;
  });
  const used = new Set(kept.filter((id): id is string => Boolean(id)));
  const pool = perks.filter((perk) => isCompatible(perk, request) && !request.excluded.includes(perk.id) && !used.has(perk.id));
  const result = [...kept];
  for (let slot = 0; slot < 4; slot += 1) {
    if (result[slot]) continue;
    if (pool.length === 0) break;
    const index = Math.floor(rng() * pool.length);
    const [picked] = pool.splice(index, 1);
    result[slot] = picked.id;
    used.add(picked.id);
  }
  return result;
}

export function encodeBuild(state: { mode: string; perks: Array<string | null>; locks: boolean[]; killerId: string | null }) {
  const params = new URLSearchParams();
  params.set("m", state.mode);
  params.set("p", state.perks.map((id) => id ?? "").join(","));
  params.set("l", state.locks.map((locked) => (locked ? "1" : "0")).join("").padEnd(4, "0").slice(0, 4));
  if (state.killerId) params.set("k", state.killerId);
  return params.toString();
}

export function decodeBuild(search: string) {
  const params = new URLSearchParams(search);
  const mode = params.get("m") === "killer" ? "killer" : "survivor";
  const perks = (params.get("p") ?? "").split(",").slice(0, 4);
  while (perks.length < 4) perks.push("");
  const locks = (params.get("l") ?? "0000")
    .slice(0, 4)
    .padEnd(4, "0")
    .split("")
    .map((bit) => bit === "1");
  return {
    mode: mode as "survivor" | "killer",
    perks: perks.map((id) => id || null),
    locks,
    killerId: params.get("k")
  };
}
