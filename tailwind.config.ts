import type { Config } from "tailwindcss";

/**
 * Tailwind supplies layout utilities only. Every colour, type role and size comes
 * from the CSS variables in src/app/globals.css, which is the single transcription
 * of docs/design-system/solitaire/MASTER.md. Never put a colour literal here.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        toolbar: "var(--bg-toolbar)",
        card: "var(--bg-card)",
        "card-back": "var(--bg-card-back)",
        "card-back-fg": "var(--fg-card-back)",
        fg: "var(--fg-default)",
        muted: "var(--fg-muted)",
        "card-red": "var(--fg-card-red)",
        "card-black": "var(--fg-card-black)",
        ring: "var(--ring-focus)",
        reject: "var(--bg-reject)",
        "edge-empty": "var(--edge-empty)",
      },
      fontFamily: {
        ui: "var(--font-ui)",
        num: "var(--font-num)",
      },
      width: { card: "var(--card-w)" },
      height: { card: "var(--card-h)" },
      borderRadius: { card: "var(--radius-card)" },
    },
  },
  plugins: [],
};

export default config;
