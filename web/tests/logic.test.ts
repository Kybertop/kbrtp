import { describe, expect, it } from "vitest";
import { classifyAbsence, completeDays } from "../src/lib/rareReturns";
import { decodeBuild, encodeBuild, isCompatible, rollBuild, type PerkRecord } from "../src/lib/dbdBuild";
import { partitionEpic, type EpicSnapshot } from "../src/lib/epicOffers";
import en from "../src/locales/en.json";
import ja from "../src/locales/ja.json";
import ru from "../src/locales/ru.json";
import zh from "../src/locales/zh-CN.json";

const perks: PerkRecord[] = [
  { id: "a", name: "Alpha", role: "survivor", characterId: null, characterName: null, categories: ["perception"], description: "See", image: null },
  { id: "b", name: "Beta", role: "survivor", characterId: "dwight", characterName: "Dwight", categories: ["support"], description: "Help", image: null },
  { id: "c", name: "Gamma", role: "survivor", characterId: "claudette", characterName: "Claudette", categories: ["perception"], description: "Heal", image: null },
  { id: "d", name: "Delta", role: "survivor", characterId: null, characterName: null, categories: ["chasing"], description: "Run", image: null },
  { id: "e", name: "Echo", role: "killer", characterId: null, characterName: null, categories: ["tracking"], description: "Track", image: null },
  { id: "f", name: "Foxtrot", role: "killer", characterId: "trapper", characterName: "The Trapper", categories: ["tracking"], description: "Trap", image: null },
  { id: "g", name: "Golf", role: "killer", characterId: "nurse", characterName: "The Nurse", categories: ["tracking"], description: "Blink", image: null },
  { id: "h", name: "Hotel", role: "killer", characterId: null, characterName: null, categories: ["cruelty"], description: "Hit", image: null },
  { id: "i", name: "India", role: "killer", characterId: null, characterName: null, categories: ["cruelty"], description: "Slow", image: null }
];

function keys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

describe("translations", () => {
  it("keeps every locale aligned with English", () => {
    const english = keys(en).sort();
    for (const locale of [ja, ru, zh]) {
      expect(keys(locale).sort()).toEqual(english);
    }
  });
});

describe("rare returns", () => {
  it("counts complete days between shop dates", () => {
    expect(completeDays("2025-01-01T00:00:00Z", "2025-10-28T00:00:00Z")).toBe(300);
  });

  it("does not treat a first appearance as a rare return", () => {
    expect(classifyAbsence(["2026-10-17T00:00:00Z"], "2026-10-17T00:00:00Z", 300).status).toBe("new");
  });

  it("does not use an empty history as a new item", () => {
    expect(classifyAbsence([], "2026-10-17T00:00:00Z", 300).status).toBe("unverified");
    expect(classifyAbsence(undefined, "2026-10-17T00:00:00Z", 300).status).toBe("unverified");
  });

  it("requires the configured absence", () => {
    const history = ["2025-01-01T00:00:00Z", "2025-10-28T00:00:00Z"];
    expect(classifyAbsence(history, "2025-10-28T00:00:00Z", 300)).toMatchObject({ status: "rare", absentDays: 300, previous: "2025-01-01" });
    expect(classifyAbsence(history, "2025-10-28T00:00:00Z", 301).status).toBe("returning");
  });
});

describe("dbd builds", () => {
  it("returns four distinct survivor perks and keeps locks", () => {
    const result = rollBuild(perks, {
      mode: "survivor",
      killerId: null,
      locked: ["a", null, null, null],
      excluded: [],
      ownedOnly: false,
      ownedCharacters: [],
      rng: () => 0
    });
    expect(result[0]).toBe("a");
    expect(result.filter(Boolean)).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
    expect(result.every((id) => !id || perks.find((perk) => perk.id === id)?.role === "survivor")).toBe(true);
  });

  it("keeps killer perks compatible with the selected killer", () => {
    const result = rollBuild(perks, {
      mode: "killer",
      killerId: "trapper",
      locked: [null, null, null, null],
      excluded: [],
      ownedOnly: false,
      ownedCharacters: [],
      rng: () => 0
    });
    for (const id of result) {
      const perk = perks.find((item) => item.id === id)!;
      expect(isCompatible(perk, { mode: "killer", killerId: "trapper", locked: [], excluded: [], ownedOnly: false, ownedCharacters: [] })).toBe(true);
      expect(perk.characterId === "nurse").toBe(false);
    }
  });

  it("round-trips a shared build", () => {
    const encoded = encodeBuild({ mode: "killer", perks: ["e", "f", null, "h"], locks: [true, false, false, true], killerId: "trapper" });
    expect(decodeBuild(encoded)).toEqual({
      mode: "killer",
      perks: ["e", "f", null, "h"],
      locks: [true, false, false, true],
      killerId: "trapper"
    });
  });
});

describe("epic windows", () => {
  const snapshot: EpicSnapshot = {
    fetchedAt: "2026-10-17T00:00:00Z",
    source: "test",
    promotions: [
      {
        id: "now",
        title: "Now",
        image: null,
        url: "https://store.epicgames.com/en-US/p/now",
        seller: null,
        offerType: "BASE_GAME",
        originalPrice: "$10",
        kind: "promotion",
        start: "2026-10-15T00:00:00Z",
        end: "2026-10-22T00:00:00Z"
      }
    ],
    upcoming: [
      {
        id: "soon",
        title: "Soon",
        image: null,
        url: "https://store.epicgames.com/en-US/p/soon",
        seller: null,
        offerType: "BASE_GAME",
        originalPrice: "$10",
        kind: "upcoming",
        start: "2026-10-22T00:00:00Z",
        end: "2026-10-29T00:00:00Z"
      }
    ],
    freeToPlay: []
  };

  it("moves an offer out of the current list after it ends", () => {
    const during = partitionEpic(snapshot, Date.parse("2026-10-17T00:00:00Z"));
    expect(during.current.map((game) => game.id)).toEqual(["now"]);
    const after = partitionEpic(snapshot, Date.parse("2026-10-22T00:00:00Z"));
    expect(after.current.map((game) => game.id)).toEqual(["soon"]);
    expect(after.upcoming).toHaveLength(0);
  });
});
