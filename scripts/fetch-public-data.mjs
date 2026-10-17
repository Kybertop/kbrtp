/**
 * Refresh public snapshots used by the static site.
 * Safe to run in GitHub Actions. Never writes API keys into output files.
 * Failures leave the previous snapshot in place.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "public", "data");

const STEAM_PROFILE = "https://steamcommunity.com/id/kybertop/?xml=1";
const STEAM_ID = "76561198053397314";
const EPIC_URL =
  "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US";
const SHRINE_URL = "https://api.nightlight.gg/v1/shrine";
const PERKS_URL = "https://dbd.tricky.lol/api/perks";
const CHARACTERS_URL = "https://dbd.tricky.lol/api/characters";

async function loadPrevious(name) {
  try {
    return JSON.parse(await readFile(path.join(dataDir, name), "utf8"));
  } catch {
    return null;
  }
}

async function save(name, value) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, name), JSON.stringify(value, null, 2) + "\n");
}

async function getText(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json, text/xml, */*", "user-agent": "kbrtp.top snapshot" },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function xmlValue(xml, tag) {
  const cdata = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdata) return decodeXml(cdata[1]).trim();
  const plain = xml.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`));
  return plain ? decodeXml(plain[1]).trim() : null;
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function currentGame(stateMessage) {
  if (!stateMessage) return null;
  const text = stateMessage.replace(/<br\s*\/?>/gi, "\n");
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length >= 2 && /^in-game$/i.test(lines[0])) return lines.slice(1).join(" ");
  return null;
}

async function fetchSteam() {
  const xml = await getText(STEAM_PROFILE);
  const stateMessage = xmlValue(xml, "stateMessage");
  const hoursRaw = xmlValue(xml, "hoursPlayed2Wk");
  const hours = hoursRaw == null || hoursRaw === "" ? null : Number(hoursRaw);
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    source: "https://steamcommunity.com/id/kybertop/?xml=1",
    profileUrl: "https://steamcommunity.com/id/kybertop/",
    steamId64: xmlValue(xml, "steamID64") || STEAM_ID,
    name: xmlValue(xml, "steamID"),
    avatar: xmlValue(xml, "avatarFull"),
    memberSince: xmlValue(xml, "memberSince"),
    onlineState: xmlValue(xml, "onlineState"),
    currentGame: currentGame(stateMessage),
    hoursPlayed2Wk: Number.isFinite(hours) ? hours : null,
    recentGames: null,
    recentGamesNote:
      "The public profile XML does not include a recently played list. A server-side Steam Web API key can add it later."
  };

  const key = process.env.STEAM_API_KEY;
  if (key) {
    const url = new URL("https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/");
    url.searchParams.set("key", key);
    url.searchParams.set("steamid", snapshot.steamId64);
    url.searchParams.set("format", "json");
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch {
      throw new Error("Steam Web API request failed");
    }
    if (!response.ok) throw new Error(`Steam Web API ${response.status}`);
    const body = await response.json();
    const games = body?.response?.games;
    snapshot.recentGames = Array.isArray(games)
      ? games.slice(0, 8).map((game) => ({
          appId: game.appid,
          name: game.name,
          playtime2Weeks: game.playtime_2weeks ?? null,
          playtimeForever: game.playtime_forever ?? null
        }))
      : [];
    snapshot.recentGamesNote = null;
  }

  if (!snapshot.name || !snapshot.avatar) throw new Error("Steam profile XML was missing a name or avatar");
  return snapshot;
}

function flattenOffers(groups) {
  const offers = [];
  for (const group of groups || []) {
    for (const offer of group?.promotionalOffers || []) offers.push(offer);
  }
  return offers;
}

function epicImage(item) {
  const images = item.keyImages || [];
  const preferred = ["OfferImageWide", "Thumbnail", "OfferImageTall"];
  for (const type of preferred) {
    const found = images.find((image) => image.type === type && image.url);
    if (found) return found.url;
  }
  return images.find((image) => image.url)?.url ?? null;
}

function epicUrl(item) {
  const slug = item.offerMappings?.[0]?.pageSlug || item.productSlug || item.urlSlug;
  if (!slug) return "https://store.epicgames.com/en-US/free-games";
  return `https://store.epicgames.com/en-US/p/${slug}`;
}

function classifyEpic(item, now) {
  if (!item?.title || item.offerType === "ADD_ON") return null;
  const price = item.price?.totalPrice || {};
  const original = price.originalPrice;
  const discount = price.discountPrice;
  const current = flattenOffers(item.promotions?.promotionalOffers).filter((offer) => {
    const start = Date.parse(offer.startDate);
    const end = Date.parse(offer.endDate);
    return Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end;
  });
  const upcoming = flattenOffers(item.promotions?.upcomingPromotionalOffers).filter((offer) => {
    const start = Date.parse(offer.startDate);
    return Number.isFinite(start) && start > now;
  });
  const freeNow = current.find((offer) => offer.discountSetting?.discountPercentage === 0);
  const freeNext = upcoming
    .filter((offer) => offer.discountSetting?.discountPercentage === 0)
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0];
  const base = {
    id: item.id,
    title: item.title,
    image: epicImage(item),
    url: epicUrl(item),
    seller: item.seller?.name || null,
    offerType: item.offerType || null,
    originalPrice: price.fmtPrice?.originalPrice || null
  };

  if (freeNow && discount === 0 && original > 0) {
    return {
      ...base,
      kind: "promotion",
      start: freeNow.startDate,
      end: freeNow.endDate
    };
  }
  if (freeNext && (original ?? 0) > 0) {
    return {
      ...base,
      kind: "upcoming",
      start: freeNext.startDate,
      end: freeNext.endDate
    };
  }
  if (original === 0 && discount === 0 && !freeNow && !freeNext) {
    return { ...base, kind: "free_to_play", start: null, end: null };
  }
  return null;
}

async function fetchEpic() {
  const body = JSON.parse(await getText(EPIC_URL));
  const elements = body?.data?.Catalog?.searchStore?.elements;
  if (!Array.isArray(elements)) throw new Error("Epic payload had no catalog elements");
  const now = Date.now();
  const games = elements.map((item) => classifyEpic(item, now)).filter(Boolean);
  return {
    fetchedAt: new Date().toISOString(),
    source: "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions",
    promotions: games.filter((game) => game.kind === "promotion"),
    upcoming: games.filter((game) => game.kind === "upcoming"),
    freeToPlay: games.filter((game) => game.kind === "free_to_play")
  };
}

async function fetchShrine() {
  const body = JSON.parse(await getText(SHRINE_URL));
  const data = body?.data;
  if (!data?.perks || !Array.isArray(data.perks)) throw new Error("Shrine payload was missing perks");
  return {
    fetchedAt: new Date().toISOString(),
    source: "https://api.nightlight.gg/v1/shrine",
    page: "https://nightlight.gg/shrine",
    start: data.start,
    end: data.end,
    week: data.week ?? null,
    perks: data.perks.map((perk) => ({
      id: perk.id,
      name: perk.name,
      character: perk.character || null,
      image: perk.image ? `https://cdn.nightlight.gg/img/${perk.image}` : null,
      shards: perk.shards ?? null,
      bloodpoints: perk.bloodpoints ?? null,
      role: inferRole(perk.character)
    }))
  };
}

function inferRole(character) {
  if (!character) return null;
  return /^the /i.test(character) ? "killer" : "survivor";
}

function cleanDescription(description, tunables) {
  const replaced = String(description || "").replace(/\{([^}]+)\}/g, (_match, token) => {
    const key = String(token).split(".").pop().toLowerCase();
    const values = tunables?.[key];
    if (Array.isArray(values) && values.length) return String(values[values.length - 1]);
    return "";
  });
  return replaced
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(li|p|div)>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function perkSlug(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchPerks() {
  const [perkBody, characterBody] = await Promise.all([
    getText(PERKS_URL).then((text) => JSON.parse(text)),
    getText(CHARACTERS_URL).then((text) => JSON.parse(text))
  ]);
  const characters = {};
  for (const [index, character] of Object.entries(characterBody)) {
    if (!character?.name) continue;
    characters[index] = {
      id: character.id || index,
      name: character.name,
      role: character.role === "killer" ? "killer" : "survivor"
    };
  }
  const perks = Object.entries(perkBody).map(([id, perk]) => {
    const character =
      perk.character === null || perk.character === undefined ? null : characters[String(perk.character)] || null;
    return {
      id,
      name: perk.name,
      role: perk.role === "killer" ? "killer" : "survivor",
      characterId: character?.id ?? null,
      characterName: character?.name ?? null,
      categories: Array.isArray(perk.categories) ? perk.categories : [],
      description: cleanDescription(perk.description, perk.tunables),
      image: perk.name ? `https://cdn.nightlight.gg/img/perks/${perkSlug(perk.name)}.png` : null
    };
  });
  perks.sort((a, b) => a.name.localeCompare(b.name));
  return {
    version: "tricky.lol-2026-10-17",
    fetchedAt: new Date().toISOString(),
    source: "https://dbd.tricky.lol/api/perks",
    characterSource: "https://dbd.tricky.lol/api/characters",
    note: "Descriptions are cleaned from the community dataset and show the highest listed tunable tier. Icons use NightLight's public image paths when the slug matches.",
    characters: Object.values(characters).sort((a, b) => a.name.localeCompare(b.name)),
    perks
  };
}

async function run(name, task) {
  try {
    const value = await task();
    await save(name, value);
    console.log(`updated ${name}`);
  } catch (error) {
    const previous = await loadPrevious(name);
    console.warn(`kept previous ${name}: ${error instanceof Error ? error.message : error}`);
    if (!previous) throw error;
  }
}

export { classifyEpic, currentGame, cleanDescription, epicUrl };

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  await run("steam.json", fetchSteam);
  await run("epic.json", fetchEpic);
  await run("shrine.json", fetchShrine);
  await run("dbd-perks.json", fetchPerks);
}
