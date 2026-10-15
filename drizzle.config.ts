import { defineConfig } from "drizzle-kit";

// Migrations próprias do plugin (mesmo padrão de venore-plugin-birthdays/drizzle.config.ts):
// separado do drizzle.config.ts do core, pra core e tests não competirem pela mesma história de
// migration.
export default defineConfig({
  schema: ["./database/schema/index.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Tabela de tracking própria, pra não compartilhar o cursor de "última migration aplicada" com
  // o core nem com outro plugin.
  migrations: { schema: "tests_migrations", table: "__drizzle_migrations" },
});
