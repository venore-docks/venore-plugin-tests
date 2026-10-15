import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Config do teste de integração do plugin (PGlite). Roda a partir do core (usa o vitest e o
// drizzle-orm dele) — ver scripts/run-integration.ps1. Os imports do SDK do core viram os mocks de
// ./mocks.ts, que trocam o banco real por um Postgres em memória.
// Barras normais: o include do vitest é glob e não entende contrabarra do Windows.
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url)).replaceAll("\\", "/");
const mocks = here("./mocks.ts");

export default defineConfig({
  root: here("../../../venore-docks"),
  resolve: {
    alias: [
      { find: /^@venore\/plugin-sdk\/(auth|observability|rbac)$/, replacement: mocks },
      { find: /^@venore\/plugin-sdk$/, replacement: mocks },
    ],
  },
  server: { fs: { strict: false } },
  test: {
    environment: "node",
    include: [here("./flow.integration.test.ts"), here("./content.integration.test.ts")],
    testTimeout: 60000,
    // O drizzle-orm precisa passar pelo vite para enxergar o @electric-sql/pglite instalado no core.
    server: { deps: { inline: [/drizzle-orm/] } },
  },
});
