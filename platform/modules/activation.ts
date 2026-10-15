import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testModuleSettings } from "../../database/schema";
import { getModule, listModules } from "./registry";

// Ativação de módulos. Sem linha em module_settings vale o `defaultEnabled` do módulo. Desligar um
// módulo NÃO apaga nada: só impede criar instância e iniciar teste novo (quem já respondeu continua
// vendo o resultado). Quem decide é o administrador (permissão tests.modules.manage).

export async function getEnabledMap(): Promise<Record<string, boolean>> {
  const rows = await db.select().from(testModuleSettings);
  const overrides = new Map(rows.map((row) => [row.moduleId, row.enabled]));
  return Object.fromEntries(listModules().map((module) => [module.id, overrides.get(module.id) ?? module.defaultEnabled]));
}

export async function isModuleEnabled(moduleId: string): Promise<boolean> {
  const module = getModule(moduleId);
  if (!module) return false;
  const [row] = await db.select().from(testModuleSettings).where(eq(testModuleSettings.moduleId, moduleId));
  return row ? row.enabled : module.defaultEnabled;
}

export async function setModuleEnabled(moduleId: string, enabled: boolean, updatedByUserId: string | null): Promise<void> {
  await db
    .insert(testModuleSettings)
    .values({ moduleId, enabled, updatedByUserId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: testModuleSettings.moduleId, set: { enabled, updatedByUserId, updatedAt: new Date() } });
}
