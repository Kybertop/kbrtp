import { z } from "zod";
import { defaultHomeWidgets, type WidgetId } from "../config/widgets";

const KEY = "kbrtp.preferences";
const FAVORITES = "kbrtp.dbd.favorites";

export const preferencesSchema = z.object({
  language: z.enum(["en", "ja", "ru", "zh-CN"]).default("en"),
  theme: z.enum(["black", "amoled"]).default("black"),
  accent: z.enum(["soft", "standard", "high"]).default("standard"),
  temperatureUnit: z.enum(["celsius", "fahrenheit"]).default("celsius"),
  weatherCity: z
    .object({
      name: z.string(),
      country: z.string().optional(),
      admin1: z.string().optional(),
      latitude: z.number(),
      longitude: z.number(),
      timezone: z.string().optional()
    })
    .nullable()
    .default(null),
  rememberWeather: z.boolean().default(false),
  homeWidgets: z.array(z.enum(["weather", "steam", "epic", "shrine"])).default(defaultHomeWidgets),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  favoriteTools: z.array(z.string()).default([]),
  rareReturnDays: z.number().int().min(1).max(5000).default(300),
  reducedMotion: z.boolean().default(false),
  ownedCharacters: z.array(z.string()).default([]),
  excludedPerks: z.array(z.string()).default([]),
  dbdOwnedOnly: z.boolean().default(false)
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const defaultPreferences: Preferences = preferencesSchema.parse({});

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPreferences;
    const parsed = preferencesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: Preferences) {
  localStorage.setItem(KEY, JSON.stringify(preferences));
}

export type FavoriteBuild = {
  id: string;
  mode: "survivor" | "killer";
  perkIds: string[];
  killerId: string | null;
  createdAt: string;
};

export function loadFavorites(): FavoriteBuild[] {
  try {
    const raw = localStorage.getItem(FAVORITES);
    if (!raw) return [];
    const parsed = z
      .array(
        z.object({
          id: z.string(),
          mode: z.enum(["survivor", "killer"]),
          perkIds: z.array(z.string()),
          killerId: z.string().nullable(),
          createdAt: z.string()
        })
      )
      .safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: FavoriteBuild[]) {
  localStorage.setItem(FAVORITES, JSON.stringify(favorites));
}

export function moveWidget(list: WidgetId[], id: WidgetId, direction: -1 | 1) {
  const index = list.indexOf(id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}
