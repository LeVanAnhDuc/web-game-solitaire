import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

/**
 * Serves ./out the way GitHub Pages will, for the e2e suite.
 *
 * `next start` cannot serve a static export, and `python -m http.server` is
 * single-threaded - four Playwright projects running in parallel starve it and the
 * failures look like application bugs. Node's server is concurrent, and this removes
 * the Python dependency from the test path entirely.
 */
const ROOT = resolve(process.argv[3] ?? "out");
const PORT = Number(process.argv[2] ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  // normalize first, then keep it inside ROOT: a static server should not be a way
  // to read the repository
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  let file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }

  try {
    if (statSync(file).isDirectory()) file = join(file, "index.html");
  } catch {
    // trailingSlash: true means /foo also lives at /foo/index.html
    try {
      statSync(join(file, "index.html"));
      file = join(file, "index.html");
    } catch {
      res.writeHead(404).end("not found");
      return;
    }
  }

  res.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`serving ${ROOT} on http://127.0.0.1:${PORT}\n`);
});
