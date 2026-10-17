export type Resource = {
  id: string;
  href: string;
  title: string;
  bodyKey: string;
  tags: Array<"weather" | "gaming" | "data" | "community" | "archive">;
};

export const resources: Resource[] = [
  {
    id: "open-meteo",
    href: "https://open-meteo.com/",
    title: "Open-Meteo",
    bodyKey: "resources.items.meteo",
    tags: ["weather", "data"]
  },
  {
    id: "fortnite-api",
    href: "https://fortnite-api.com/",
    title: "Fortnite-API",
    bodyKey: "resources.items.fortnite",
    tags: ["gaming", "data"]
  },
  {
    id: "nightlight",
    href: "https://nightlight.gg/shrine",
    title: "NightLight",
    bodyKey: "resources.items.nightlight",
    tags: ["gaming", "data"]
  },
  {
    id: "tricky",
    href: "https://dbd.tricky.lol/",
    title: "dbd.tricky.lol",
    bodyKey: "resources.items.tricky",
    tags: ["gaming", "data"]
  },
  {
    id: "epic",
    href: "https://store.epicgames.com/en-US/free-games",
    title: "Epic Games Store",
    bodyKey: "resources.items.epic",
    tags: ["gaming"]
  },
  {
    id: "steam",
    href: "https://steamcommunity.com/id/kybertop/",
    title: "Steam",
    bodyKey: "resources.items.steam",
    tags: ["gaming", "community"]
  },
  {
    id: "outlast",
    href: "https://outlasttrialsstats.com/",
    title: "The Outlast Trials Stats",
    bodyKey: "resources.items.outlast",
    tags: ["gaming"]
  },
  {
    id: "giscus",
    href: "https://giscus.app/",
    title: "Giscus",
    bodyKey: "resources.items.giscus",
    tags: ["community"]
  },
  {
    id: "archive",
    href: "/1/",
    title: "Solar Voyage",
    bodyKey: "resources.items.archive",
    tags: ["archive"]
  }
];
