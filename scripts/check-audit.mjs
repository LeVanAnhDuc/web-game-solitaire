/**
 * Enforces NFR-SEC-05 - "no vulnerability at high or above" - exactly as written.
 *
 * `yarn audit` cannot do this on its own: yarn 1 returns a bitmask covering EVERY
 * severity it found, so a moderate advisory fails the build too. Gating on that
 * would be stricter than the threshold says, and a gate nobody agreed to is a gate
 * people start bypassing.
 *
 *   yarn audit --json | node scripts/check-audit.mjs
 */
const BLOCKING = new Set(["high", "critical"]);

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

const advisories = new Map();
const failures = [];
let sawSummary = false;

for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue; // yarn interleaves non-JSON lines
  }
  // The registry can time out, and yarn reports that as a JSON line on stdout while
  // the pipe still closes cleanly. Without this branch the script would go on to
  // print "no high or critical advisory (0 total)" and exit 0 - a security gate that
  // turns green when the audit never ran is worse than no gate at all.
  if (entry.type === "error") {
    failures.push(String(entry.data));
    continue;
  }
  if (entry.type === "auditSummary") sawSummary = true;
  if (entry.type !== "auditAdvisory") continue;
  const a = entry.data.advisory;
  advisories.set(a.id, {
    severity: a.severity,
    module: a.module_name,
    vulnerable: a.vulnerable_versions,
    patched: a.patched_versions,
    title: a.title,
    path: entry.data.resolution?.path ?? "",
  });
}

if (failures.length > 0 || !sawSummary) {
  console.error("NFR-SEC-05 could not be checked: yarn audit did not complete.");
  console.error("");
  for (const message of failures) console.error(`  ${message}`);
  if (failures.length === 0) console.error("  no auditSummary in the output");
  console.error("");
  console.error("Re-run it; do not treat this as a pass.");
  process.exit(1);
}

const all = [...advisories.values()];
const blocking = all.filter((a) => BLOCKING.has(a.severity));
const rest = all.filter((a) => !BLOCKING.has(a.severity));

if (rest.length > 0) {
  console.log(`${rest.length} advisory(ies) below high, not blocking:`);
  for (const a of rest) console.log(`  ${a.severity.padEnd(8)} ${a.module}  ${a.title}`);
  console.log("");
}

if (blocking.length === 0) {
  console.log(`NFR-SEC-05: no high or critical advisory (${all.length} total).`);
  process.exit(0);
}

console.error(`NFR-SEC-05 violated: ${blocking.length} advisory(ies) at high or above\n`);
for (const a of blocking) {
  console.error(`  ${a.severity.toUpperCase()}  ${a.module} ${a.vulnerable}`);
  console.error(`    ${a.title}`);
  console.error(`    via ${a.path}`);
  console.error(`    fixed in ${a.patched}\n`);
}
console.error("Fix it, or add a resolutions entry in package.json pinning the patched range.");
process.exit(1);
