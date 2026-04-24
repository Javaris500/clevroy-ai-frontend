import type { Config } from "tailwindcss";

// Tailwind v4 is CSS-first: all tokens live in app/globals.css inside @theme.
// This file exists for compatibility with tooling that expects it and to point
// the scanner at the content globs. Do not add design tokens here.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}"
  ]
};

export default config;
