import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Enforces NFR-PERF-05 in CI.
 *
 * The measurement comes from the EXPORTED HTML, not from a Next.js internal and not
 * from scraping the build table: whatever `out/index.html` references is by
 * definition what the browser fetches on a first load. A guard built on `next
 * build`'s printed output breaks on a Next release; this one breaks on a regression.
 *
 * Summing every file under _next/static/chunks would be the easy version and it is
 * wrong - it counts `polyfills` (served only to old browsers) and every other
 * route's chunk, which reads 248 kB against a real first load of 112 kB.
 */
const LIMIT_KB = Number(process.env.BUNDLE_LIMIT_KB ?? 150);
const root = resolve(process.argv[2] ?? "out");
const page = process.argv[3] ?? "index.html";

let html;
try {
  html = readFileSync(join(root, page), "utf8");
} catch {
  console.error(`cannot read ${join(root, page)} - run \`yarn build\` first`);
  process.exit(1);
}

// <script src="/_next/..."> and <link rel="preload" as="script" href="/_next/...">
const refs = new Set();
for (const [, url] of html.matchAll(/(?:src|href)="(\/_next\/[^"]+\.js)"/g)) {
  refs.add(url);
}
// the App Router also lists chunks inside the inlined flight payload
for (const [, url] of html.matchAll(/\\?"(\/_next\/static\/chunks\/[^"\\]+\.js)\\?"/g)) {
  refs.add(url);
}

if (refs.size === 0) {
  console.error("found no script references in the exported HTML - check the regexes");
  process.exit(1);
}

let total = 0;
let legacy = 0;
const rows = [];
for (const url of refs) {
  const file = join(root, url.replace(/^\//, ""));
  let bytes;
  try {
    bytes = readFileSync(file);
  } catch {
    console.error(`referenced but missing: ${url}`);
    process.exit(1);
  }
  const gz = gzipSync(bytes).length;
  // polyfills-*.js goes only to browsers that ask for it, and Next leaves it out of
  // the "First Load JS" figure that NFR-PERF-05's 150 kB was written against. It is
  // measured and printed anyway, so it cannot grow unnoticed.
  const isLegacy = /\/polyfills-[^/]*\.js$/.test(url);
  if (isLegacy) legacy += gz;
  else total += gz;
  rows.push({ url, gz, isLegacy });
}

rows.sort((a, b) => b.gz - a.gz);
for (const row of rows) {
  const tag = row.isLegacy ? "   (legacy browsers only)" : "";
  console.log(`  ${(row.gz / 1024).toFixed(1).padStart(7)} kB gz  ${row.url}${tag}`);
}

const totalKb = total / 1024;
const legacyKb = legacy / 1024;
console.log(
  `\nfirst load: ${totalKb.toFixed(1)} kB gzipped / ${LIMIT_KB} kB (NFR-PERF-05)` +
    `\nplus ${legacyKb.toFixed(1)} kB of polyfills for browsers that ask for them` +
    ` — ${(totalKb + legacyKb).toFixed(1)} kB worst case`,
);

if (totalKb > LIMIT_KB) {
  console.error(`\nover budget by ${(totalKb - LIMIT_KB).toFixed(1)} kB`);
  process.exit(1);
}
