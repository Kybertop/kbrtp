import { cp, copyFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
await copyFile(path.join(root, "dist", "index.html"), path.join(root, "dist", "404.html"));
await cp(path.join(root, "1"), path.join(root, "dist", "1"), { recursive: true });
console.log("copied SPA fallback and archived site");
