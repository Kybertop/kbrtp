import { z } from "zod";
import type { EpicSnapshot } from "../lib/epicOffers";

const gameSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().nullable(),
  url: z.string(),
  seller: z.string().nullable(),
  offerType: z.string().nullable(),
  originalPrice: z.string().nullable(),
  kind: z.enum(["promotion", "upcoming", "free_to_play"]),
  start: z.string().nullable(),
  end: z.string().nullable()
});

const snapshotSchema = z.object({
  fetchedAt: z.string(),
  source: z.string(),
  promotions: z.array(gameSchema),
  upcoming: z.array(gameSchema),
  freeToPlay: z.array(gameSchema)
});

export async function loadEpic(signal?: AbortSignal): Promise<EpicSnapshot> {
  const response = await fetch(`/data/epic.json?t=${Date.now()}`, { signal, cache: "no-cache" });
  if (!response.ok) throw new Error("epic snapshot unavailable");
  return snapshotSchema.parse(await response.json());
}
