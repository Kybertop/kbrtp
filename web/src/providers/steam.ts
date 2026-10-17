import { z } from "zod";

const steamSchema = z.object({
  fetchedAt: z.string(),
  source: z.string(),
  profileUrl: z.string(),
  steamId64: z.string(),
  name: z.string(),
  avatar: z.string(),
  memberSince: z.string().nullable(),
  onlineState: z.string().nullable(),
  currentGame: z.string().nullable(),
  hoursPlayed2Wk: z.number().nullable(),
  recentGames: z
    .array(
      z.object({
        appId: z.number(),
        name: z.string(),
        playtime2Weeks: z.number().nullable(),
        playtimeForever: z.number().nullable()
      })
    )
    .nullable(),
  recentGamesNote: z.string().nullable()
});

export type SteamProfile = z.infer<typeof steamSchema>;

export async function loadSteam(signal?: AbortSignal) {
  const response = await fetch(`/data/steam.json?t=${Date.now()}`, { signal, cache: "no-cache" });
  if (!response.ok) throw new Error("steam snapshot unavailable");
  return steamSchema.parse(await response.json());
}
