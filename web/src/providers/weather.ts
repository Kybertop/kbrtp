import { z } from "zod";
import { fetchJson } from "../lib/http";
import { roundCoord } from "../lib/format";

const geocodeSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        timezone: z.string().optional()
      })
    )
    .optional()
});

const forecastSchema = z.object({
  timezone: z.string().optional(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
    precipitation: z.number()
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_sum: z.array(z.number())
  })
});

export type City = {
  id?: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type Forecast = {
  timezone?: string;
  updatedAt: string;
  temperature: number;
  apparent: number;
  code: number;
  wind: number;
  precipitation: number;
  days: Array<{ date: string; code: number; high: number; low: number; precipitation: number }>;
};

const languageMap: Record<string, string> = { en: "en", ja: "ja", ru: "ru", "zh-CN": "zh" };

export async function searchCities(query: string, language: string, signal?: AbortSignal) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", languageMap[language] ?? "en");
  url.searchParams.set("format", "json");
  const body = geocodeSchema.parse(await fetchJson(url.toString(), { signal }));
  return (body.results ?? []).map((city) => ({
    ...city,
    latitude: roundCoord(city.latitude),
    longitude: roundCoord(city.longitude)
  }));
}

export async function reverseCity(latitude: number, longitude: number, language: string, signal?: AbortSignal): Promise<City> {
  const rounded = { latitude: roundCoord(latitude), longitude: roundCoord(longitude) };
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
    url.searchParams.set("latitude", String(rounded.latitude));
    url.searchParams.set("longitude", String(rounded.longitude));
    url.searchParams.set("language", languageMap[language] ?? "en");
    const body = geocodeSchema.parse(await fetchJson(url.toString(), { signal }));
    const first = body.results?.[0];
    if (first) return { ...first, latitude: roundCoord(first.latitude), longitude: roundCoord(first.longitude) };
  } catch {
    /* coordinate label below */
  }
  return { name: `${rounded.latitude}, ${rounded.longitude}`, ...rounded };
}

export async function loadForecast(city: City, unit: "celsius" | "fahrenheit", signal?: AbortSignal): Promise<Forecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(roundCoord(city.latitude)));
  url.searchParams.set("longitude", String(roundCoord(city.longitude)));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("forecast_days", "4");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", unit);
  url.searchParams.set("wind_speed_unit", unit === "fahrenheit" ? "mph" : "kmh");
  url.searchParams.set("precipitation_unit", unit === "fahrenheit" ? "inch" : "mm");
  const body = forecastSchema.parse(await fetchJson(url.toString(), { signal }));
  return {
    timezone: body.timezone,
    updatedAt: body.current.time,
    temperature: body.current.temperature_2m,
    apparent: body.current.apparent_temperature,
    code: body.current.weather_code,
    wind: body.current.wind_speed_10m,
    precipitation: body.current.precipitation,
    days: body.daily.time.map((date, index) => ({
      date,
      code: body.daily.weather_code[index],
      high: body.daily.temperature_2m_max[index],
      low: body.daily.temperature_2m_min[index],
      precipitation: body.daily.precipitation_sum[index]
    }))
  };
}
