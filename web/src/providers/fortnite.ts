import { z } from "zod";
import { fetchJson, HttpError } from "../lib/http";
import { classifyAbsence, type Absence } from "../lib/rareReturns";

const cosmeticSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().default(""),
    type: z.object({ value: z.string().optional(), displayValue: z.string().optional() }).optional(),
    rarity: z.object({ value: z.string().optional(), displayValue: z.string().optional() }).optional(),
    images: z
      .object({
        icon: z.string().optional(),
        smallIcon: z.string().optional(),
        featured: z.string().optional()
      })
      .optional(),
    shopHistory: z.array(z.string()).optional()
  })
  .passthrough();

const entrySchema = z
  .object({
    offerId: z.string().optional(),
    regularPrice: z.number().nullable().optional(),
    finalPrice: z.number().nullable().optional(),
    layout: z.object({ name: z.string().optional(), id: z.string().optional() }).optional(),
    bundle: z
      .object({
        name: z.string().optional(),
        info: z.string().optional(),
        image: z.string().optional()
      })
      .nullable()
      .optional(),
    brItems: z.array(cosmeticSchema).optional().default([])
  })
  .passthrough();

export type ShopCosmetic = {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  rarityValue: string;
  image: string | null;
  history: string[] | null;
  absence: Absence;
};

export type ShopOffer = {
  id: string;
  kind: "item" | "bundle";
  name: string;
  section: string;
  price: number | null;
  regularPrice: number | null;
  image: string | null;
  items: ShopCosmetic[];
};

export type ShopModel = {
  date: string;
  fetchedAt: string;
  language: string;
  offers: ShopOffer[];
  fallbackLanguage: boolean;
};

const languageMap: Record<string, string> = { en: "en", ja: "ja", ru: "ru", "zh-CN": "zh-CN" };

function mapCosmetic(raw: z.infer<typeof cosmeticSchema>, shopDate: string, threshold: number): ShopCosmetic {
  const history = raw.shopHistory ?? null;
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    type: raw.type?.displayValue || raw.type?.value || "",
    rarity: raw.rarity?.displayValue || raw.rarity?.value || "",
    rarityValue: raw.rarity?.value || "",
    image: raw.images?.icon || raw.images?.featured || raw.images?.smallIcon || null,
    history,
    absence: classifyAbsence(history, shopDate, threshold)
  };
}

export function parseShop(payload: unknown, language: string, threshold: number, fallbackLanguage: boolean): ShopModel {
  const root = z
    .object({
      data: z.object({
        date: z.string(),
        entries: z.array(z.unknown())
      })
    })
    .parse(payload);
  const offers: ShopOffer[] = [];
  root.data.entries.forEach((entry, index) => {
    const parsed = entrySchema.safeParse(entry);
    if (!parsed.success || parsed.data.brItems.length === 0) return;
    const items = parsed.data.brItems.map((item) => mapCosmetic(item, root.data.date, threshold));
    const bundle = parsed.data.bundle;
    const kind = items.length > 1 || bundle?.name ? "bundle" : "item";
    offers.push({
      id: parsed.data.offerId || `${kind}-${index}`,
      kind,
      name: kind === "bundle" ? bundle?.name || items.map((item) => item.name).join(", ") : items[0].name,
      section: parsed.data.layout?.name || parsed.data.layout?.id || "",
      price: parsed.data.finalPrice ?? null,
      regularPrice: parsed.data.regularPrice ?? null,
      image: (kind === "bundle" ? bundle?.image : null) || items[0].image,
      items
    });
  });
  return {
    date: root.data.date,
    fetchedAt: new Date().toISOString(),
    language,
    offers,
    fallbackLanguage
  };
}

export function repriceAbsence(shop: ShopModel, threshold: number): ShopModel {
  return {
    ...shop,
    offers: shop.offers.map((offer) => ({
      ...offer,
      items: offer.items.map((item) => ({
        ...item,
        absence: classifyAbsence(item.history, shop.date, threshold)
      }))
    }))
  };
}

export type RareReturn = ShopCosmetic & { price: number | null; bundle: boolean; section: string };

export function rareReturns(shop: ShopModel): RareReturn[] {
  const seen = new Map<string, RareReturn>();
  for (const offer of shop.offers) {
    for (const item of offer.items) {
      if (item.absence.status !== "rare") continue;
      const price = offer.kind === "item" ? offer.price : null;
      const existing = seen.get(item.id);
      if (!existing || (existing.price == null && price != null)) {
        seen.set(item.id, { ...item, price, bundle: offer.kind === "bundle", section: offer.section });
      }
    }
  }
  return [...seen.values()];
}

async function requestShop(language: string, signal?: AbortSignal) {
  const url = new URL("https://fortnite-api.com/v2/shop");
  url.searchParams.set("language", languageMap[language] ?? "en");
  url.searchParams.set("responseFlags", "4");
  return fetchJson(url.toString(), { signal, timeoutMs: 20000 });
}

export async function loadShop(language: string, threshold: number, signal?: AbortSignal) {
  try {
    const payload = await requestShop(language, signal);
    return parseShop(payload, language, threshold, false);
  } catch (error) {
    if (language === "en") throw error;
    if (error instanceof HttpError && error.status < 500 && error.status !== 429) {
      const payload = await requestShop("en", signal);
      return parseShop(payload, "en", threshold, true);
    }
    throw error;
  }
}

const searchSchema = z.object({
  status: z.number().optional(),
  data: z.array(cosmeticSchema)
});

export async function searchCosmetics(query: string, language: string, signal?: AbortSignal) {
  const url = new URL("https://fortnite-api.com/v2/cosmetics/br/search/all");
  url.searchParams.set("name", query);
  url.searchParams.set("matchMethod", "contains");
  url.searchParams.set("language", languageMap[language] ?? "en");
  try {
    const body = searchSchema.parse(await fetchJson(url.toString(), { signal }));
    return body.data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type?.displayValue || "",
      rarity: item.rarity?.displayValue || "",
      rarityValue: item.rarity?.value || "",
      image: item.images?.icon || item.images?.smallIcon || null
    }));
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return [];
    throw error;
  }
}
