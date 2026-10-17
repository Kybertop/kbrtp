import { z } from "zod";
import { fetchJson } from "../lib/http";
import type { PerkRecord } from "../lib/dbdBuild";

const shrinePerkSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  shards: z.number().nullable().optional(),
  bloodpoints: z.number().nullable().optional()
});

const liveShrineSchema = z.object({
  data: z.object({
    start: z.string(),
    end: z.string(),
    week: z.number().optional(),
    perks: z.array(shrinePerkSchema)
  })
});

const snapshotShrineSchema = z.object({
  fetchedAt: z.string(),
  source: z.string(),
  page: z.string(),
  start: z.string(),
  end: z.string(),
  week: z.number().nullable().optional(),
  perks: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      character: z.string().nullable(),
      image: z.string().nullable(),
      shards: z.number().nullable(),
      bloodpoints: z.number().nullable(),
      role: z.string().nullable()
    })
  )
});

export type ShrinePerk = {
  id: number;
  name: string;
  character: string | null;
  image: string | null;
  shards: number | null;
  bloodpoints: number | null;
  role: "survivor" | "killer" | null;
};

export type ShrineModel = {
  fetchedAt: string;
  source: string;
  page: string;
  live: boolean;
  start: string;
  end: string;
  perks: ShrinePerk[];
};

function roleFromName(character: string | null | undefined): "survivor" | "killer" | null {
  if (!character) return null;
  return /^the /i.test(character) ? "killer" : "survivor";
}

export async function loadShrine(signal?: AbortSignal): Promise<ShrineModel> {
  try {
    const body = liveShrineSchema.parse(await fetchJson("https://api.nightlight.gg/v1/shrine", { signal }));
    return {
      fetchedAt: new Date().toISOString(),
      source: "https://api.nightlight.gg/v1/shrine",
      page: "https://nightlight.gg/shrine",
      live: true,
      start: body.data.start,
      end: body.data.end,
      perks: body.data.perks.map((perk) => ({
        id: perk.id,
        name: perk.name,
        character: perk.character ?? null,
        image: perk.image ? `https://cdn.nightlight.gg/img/${perk.image}` : null,
        shards: perk.shards ?? null,
        bloodpoints: perk.bloodpoints ?? null,
        role: roleFromName(perk.character)
      }))
    };
  } catch (liveError) {
    const response = await fetch("/data/shrine.json", { signal, cache: "no-cache" });
    if (!response.ok) throw liveError;
    const snapshot = snapshotShrineSchema.parse(await response.json());
    return {
      fetchedAt: snapshot.fetchedAt,
      source: snapshot.source,
      page: snapshot.page,
      live: false,
      start: snapshot.start,
      end: snapshot.end,
      perks: snapshot.perks.map((perk) => ({
        ...perk,
        role: perk.role === "killer" || perk.role === "survivor" ? perk.role : null
      }))
    };
  }
}

const datasetSchema = z.object({
  version: z.string(),
  fetchedAt: z.string(),
  source: z.string(),
  note: z.string(),
  characters: z.array(z.object({ id: z.string(), name: z.string(), role: z.enum(["survivor", "killer"]) })),
  perks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.enum(["survivor", "killer"]),
      characterId: z.string().nullable(),
      characterName: z.string().nullable(),
      categories: z.array(z.string()),
      description: z.string(),
      image: z.string().nullable()
    })
  )
});

export type PerkDataset = {
  version: string;
  fetchedAt: string;
  source: string;
  note: string;
  characters: Array<{ id: string; name: string; role: "survivor" | "killer" }>;
  perks: PerkRecord[];
};

export async function loadPerkDataset(signal?: AbortSignal): Promise<PerkDataset> {
  const response = await fetch("/data/dbd-perks.json", { signal, cache: "no-cache" });
  if (!response.ok) throw new Error("perk dataset unavailable");
  return datasetSchema.parse(await response.json());
}
