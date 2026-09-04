import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // tsconfig says jsx: "preserve" because Next.js needs it, which leaves the test
  // runner with untransformed JSX. The plugin is the override, and it lives here
  // rather than in tsconfig so the Next build is untouched.
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // happy-dom is only needed by the component tests. Everything under src/game is
    // framework-free by design and never touches the DOM - invariant #1.
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
