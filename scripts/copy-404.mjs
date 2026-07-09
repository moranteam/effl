import { cpSync, copyFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join } from "node:path";

if (existsSync("dist/index.html")) {
  copyFileSync("dist/index.html", "dist/404.html");
}

// Copy public static trees into dist without raw photo masters.
function copyFiltered(src, dest, skipNames = new Set(["raw-photos"])) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (skipNames.has(name) || name === ".DS_Store") continue;
    const from = join(src, name);
    const to = join(dest, name);
    const st = statSync(from);
    if (st.isDirectory()) copyFiltered(from, to, skipNames);
    else copyFileSync(from, to);
  }
}

copyFiltered("assets", "dist/assets");
if (existsSync("docs")) {
  cpSync("docs", "dist/docs", { recursive: true });
}
