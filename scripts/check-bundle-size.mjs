// Fails when a gzipped chunk of the production build is over its budget; run after `npm run build`
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ASSETS_DIR = "build/assets";
const KB = 1000;

// Gzipped kB: the size measured when the budget was set, plus 10%, rounded up.
const BUDGETS_KB = {
  "index-": 94, // entry chunk
  "ProjectPage-": 18, // project page route
};

const files = readdirSync(ASSETS_DIR).filter((name) => name.endsWith(".js"));
let failed = false;

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

  const [file] = matches;
  const gzipBytes = gzipSync(readFileSync(join(ASSETS_DIR, file))).length;
  const budgetBytes = budgetKb * KB;
  const status = gzipBytes > budgetBytes ? "FAIL" : "ok";
  console.log(
    `${status.padEnd(4)} ${file}: ${(gzipBytes / KB).toFixed(2)} kB gzip, budget ${budgetKb} kB`,
  );
  if (gzipBytes > budgetBytes) failed = true;
}

if (failed) {
  console.error("bundle size over budget (see scripts/check-bundle-size.mjs)");
  process.exitCode = 1;
}
