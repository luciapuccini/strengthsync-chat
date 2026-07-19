import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), cloudflare(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src/ui"),
    },
  },
  // Bind on all interfaces so the phone can reach Vite over Tailscale (not just localhost).
  // allowedHosts: Tailscale MagicDNS names (e.g. "mac") fail Vite's default host check.
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
});
