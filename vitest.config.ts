import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Carga .env.local y .env.test.local (este último con SUPABASE_SECRET_KEY, solo pruebas).
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
