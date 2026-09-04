import type { NextConfig } from "next";

/**
 * GitHub Pages serves the site from /<repo-name>; running locally it sits at the
 * root. GITHUB_PAGES is set only by the deploy workflow, so `yarn dev` and a local
 * `yarn build` keep serving from the root.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = "/web-game-solitaire";

const nextConfig: NextConfig = {
  /**
   * The whole game runs client-side, so it exports to static HTML: no Node server,
   * and the infrastructure ceiling in docs/01-product/overview.md stays at 0 VND.
   * Present from the first commit on purpose - adding it later surfaces a pile of
   * things that do not export.
   */
  output: "export",
  basePath: isGithubPages ? basePath : undefined,
  assetPrefix: isGithubPages ? basePath : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
