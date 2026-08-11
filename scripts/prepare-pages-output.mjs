import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const dist = "dist";
const clientDir = join(dist, "client");
const serverDir = join(dist, "server");
const pagesDir = join(dist, "pages");

if (!existsSync(clientDir) || !existsSync(serverDir)) {
  throw new Error("Missing Vinext build output. Run vinext build before preparing Pages output.");
}

await rm(pagesDir, { recursive: true, force: true });
await mkdir(pagesDir, { recursive: true });

await cp(clientDir, pagesDir, { recursive: true });
await cp(serverDir, pagesDir, { recursive: true });
await cp(join(serverDir, "index.js"), join(pagesDir, "_worker.js"));

console.log("Prepared Cloudflare Pages output in dist/pages");
