// Mocks do SDK do core para rodar os serviços do plugin contra um Postgres em memória (PGlite).
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const client = new PGlite();
export const db = drizzle(client);

export async function applyMigrations(dir: string) {
  // Aplica TODAS as migrations em ordem (0000, 0001…) — é o que o install do plugin faz.
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(`${dir}/${file}`, "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await client.exec(statement);
    }
  }
}

// --- estado controlável pelo teste ---
export type TestUser = { id: string; name: string | null; email: string | null };
export const state: { current: TestUser | null; users: TestUser[]; permissions: Set<string> } = {
  current: null,
  users: [],
  permissions: new Set(),
};

export const getCurrentUser = async () => ({ success: true as const, data: state.current });
export const listUsers = async () => ({ success: true as const, data: state.users.map((user) => ({ ...user, status: "approved" })) });
export const authorizeActor = async (permission: string) =>
  state.current && state.permissions.has(permission)
    ? { authorized: true as const, actorId: state.current.id }
    : { authorized: false as const, error: { code: "forbidden", message: "sem permissão" } };

export const beginOperation = () => ({});
export const endOperation = () => {};
export const staticBreadcrumbSegment = (input: unknown) => input;
export const isPluginActive = async () => true;
