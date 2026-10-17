# KBRTP

Personal site for KyberTop at [kbrtp.top](https://kbrtp.top). The app is a static React build for GitHub Pages. The previous solar-system site is preserved at `/1/`.

## Scripts

```bash
cd web
npm install
npm test
npm run dev
npm run build
npm run preview
```

`npm run build` refreshes public snapshots, typechecks, builds `web/dist/`, copies `index.html` to `404.html` so nested routes survive a refresh, and copies that production build to the repository root. This repository's GitHub Pages site publishes the `main` branch root, so the built files have to live there. The app source stays in `web/`.

## GitHub Pages

1. In the repository settings, set Pages to **GitHub Actions**.
2. Pages is set to publish the `main` branch root. The production `index.html`, `404.html`, `assets/`, and `CNAME` are committed there. `CNAME` contains `kbrtp.top`.
3. The workflow `.github/workflows/pages.yml` rebuilds that root on changes under `web/`, on demand, and once a day.
4. DNS for the apex domain should point at GitHub Pages:

   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

   `www` can be a CNAME to `kybertop.github.io`.

No private API keys are compiled into the JavaScript. Optional `STEAM_API_KEY` is read only by the snapshot script in Actions.

## Data snapshots

| File | Source | Browser |
| --- | --- | --- |
| `public/data/steam.json` | Public Steam profile XML | Steam does not allow browser requests |
| `public/data/epic.json` | Epic promotions catalog | No CORS for this site |
| `public/data/shrine.json` | NightLight shrine feed | Live request first, snapshot if it fails |
| `public/data/dbd-perks.json` | dbd.tricky.lol perk and character data | Loaded from the site itself |

`.github/workflows/refresh-data.yml` commits new snapshots daily. The Pages workflow also refreshes them during the deploy build.

A game is marked free only when Epic's feed includes a 100% promotional window and a zero discount price. Permanently free listings stay in a separate group. Shop absence for Fortnite uses `shopHistory` dates, not the date a cosmetic was added to the database.

## Guestbook

Giscus is installed in the page, but GitHub Discussions are not enabled on `Kybertop/kbrtp` yet. The guestbook stays empty until these steps are done:

1. Enable Discussions on the repository.
2. Install the [Giscus GitHub App](https://github.com/apps/giscus) on `Kybertop/kbrtp`.
3. Create a discussion category named `Guestbook`.
4. Copy the category ID from [giscus.app](https://giscus.app/) into `categoryId` in `src/config/giscus.ts`.

The repository ID already in that file is `R_kgDOQ3QU-Q`. Visitors post with their GitHub account. Do not put a GitHub token in the frontend.

## Profile

Edit `src/config/profile.ts` for the Discord invite, an optional Discord profile URL, and an optional Outlast Trials profile URL. The username `kybertop` is not used as a Discord user ID, and no presence is invented.

Steam recently played games appear only when the Actions secret `STEAM_API_KEY` is set. The key stays on the server. The public profile XML does not include that list.

## Outlast Trials

[outlasttrialsstats.com](https://outlasttrialsstats.com/) does not publish a public player API. Their Discord bot reads statistics only after a player links an account. The site also restricts framing. This project therefore shows a profile card and a direct link, not embedded pages or made-up records.

## Weather

Forecasts come from [Open-Meteo](https://open-meteo.com/) in the browser. The free tier is non-commercial and the data is [CC BY 4.0](https://open-meteo.com/en/license). The widget links the attribution. Location is requested only after "Use my location".

## Dead by Daylight

The shrine uses the feed NightLight publishes for chat commands: `https://api.nightlight.gg/v1/shrine`. The next change time is the feed's `end` timestamp. Perk generation uses the versioned dataset in `public/data/dbd-perks.json` and runs locally after that file loads. Descriptions are cleaned from that dataset and show the highest listed tier.
