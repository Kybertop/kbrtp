import { cp, copyFile, rm } from "node:fs/promises";
import path from "node:path";

const web = path.resolve(import.meta.dirname, "..");
const repo = path.resolve(web, "..");
const dist = path.join(web, "dist");

await copyFile(path.join(dist, "index.html"), path.join(dist, "404.html"));
await cp(path.join(repo, "1"), path.join(dist, "1"), { recursive: true });

const files = ["index.html", "404.html", "CNAME", "favicon.svg", "giscus.css", "og.svg", "pattern.svg", "pattern-night.svg"];
for (const file of files) {
  await copyFile(path.join(dist, file), path.join(repo, file));
}
await rm(path.join(repo, "assets"), { recursive: true, force: true });
await cp(path.join(dist, "assets"), path.join(repo, "assets"), { recursive: true });
await rm(path.join(repo, "data"), { recursive: true, force: true });
await cp(path.join(dist, "data"), path.join(repo, "data"), { recursive: true });
console.log("published the production site to the repository root for GitHub Pages");
