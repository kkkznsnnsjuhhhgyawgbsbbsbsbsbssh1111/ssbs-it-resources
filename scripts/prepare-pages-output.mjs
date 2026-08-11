import { cp, mkdir, rm, writeFile } from "node:fs/promises";
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
await cp(serverDir, join(pagesDir, "server"), { recursive: true });
await writeFile(
  join(pagesDir, "_worker.js"),
  'import worker from "./server/index.js";\n\nexport default worker;\n',
);
await writeFile(
  join(pagesDir, "_routes.json"),
  JSON.stringify(
    {
      version: 1,
      include: ["/*"],
      exclude: [
        "/_next/static/*",
        "/favicon.svg",
        "/file.svg",
        "/globe.svg",
        "/window.svg",
      ],
    },
    null,
    2,
  ),
);

console.log("Prepared Cloudflare Pages output in dist/pages");
