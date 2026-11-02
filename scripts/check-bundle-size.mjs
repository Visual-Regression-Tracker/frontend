// Fails when the gzipped production build is over its budgets; run after `npm run build`
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUILD_DIR = "build";
const ASSETS_DIR = join(BUILD_DIR, "assets");
const KB = 1000;

// Gzipped kB: the size measured when the budget was set, plus 10%, rounded up.
const INITIAL_LOAD_BUDGET_KB = 287; // entry script plus every chunk index.html preloads
const BUDGETS_KB = {
  "ProjectPage-": 18, // project page route
};

const gzipKb = (file) => gzipSync(readFileSync(file)).length / KB;
let failed = false;

const report = (label, sizeKb, budgetKb) => {
  const status = sizeKb > budgetKb ? "FAIL" : "ok";
  console.log(
    `${status.padEnd(4)} ${label}: ${sizeKb.toFixed(2)} kB gzip, budget ${budgetKb} kB`,
  );
  if (sizeKb > budgetKb) failed = true;
};

// Chunk boundaries move with every dedupe, so the JS of the first load is budgeted as a whole
const html = readFileSync(join(BUILD_DIR, "index.html"), "utf8");
const initialScripts = [
  ...html.matchAll(
    /<(?:script type="module"[^>]* src|link rel="modulepreload"[^>]* href)="\/([^"]+\.js)"/g,
  ),
].map(([, path]) => path);
if (initialScripts.length === 0) {
  console.error(`found no module scripts in ${BUILD_DIR}/index.html`);
  failed = true;
} else {
  report(
    `initial load (${initialScripts.length} scripts)`,
    initialScripts.reduce(
      (sum, path) => sum + gzipKb(join(BUILD_DIR, path)),
      0,
    ),
    INITIAL_LOAD_BUDGET_KB,
  );
}

const files = readdirSync(ASSETS_DIR).filter((name) => name.endsWith(".js"));
for (const [prefix, budgetKb] of Object.entries(BUDGETS_KB)) {
  const matches = files.filter((name) =>
    new RegExp(String.raw`^${prefix}[^.]+\.js$`).test(name),
  );
  if (matches.length !== 1) {
    console.error(
      `expected one ${prefix}*.js chunk in ${ASSETS_DIR}, found ${matches.length}`,
    );
    failed = true;
    continue;
  }
  report(matches[0], gzipKb(join(ASSETS_DIR, matches[0])), budgetKb);
}

if (failed) {
  console.error("bundle size over budget (see scripts/check-bundle-size.mjs)");
  process.exitCode = 1;
}
