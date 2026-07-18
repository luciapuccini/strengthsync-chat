import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src/ui"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/ui/test/setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "src/worker/**"],
  },
});
