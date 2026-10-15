import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listModuleSummaries } from "./service";
import type { ListModulesResult } from "./types";

// Catálogo público: só os módulos LIGADOS (landing, convites). Sem gate de propósito — é o que
// qualquer visitante vê.
export async function listActiveModulesHandler(): Promise<ListModulesResult> {
  return listModuleSummaries("active");
}

// Tela de administração: todos os módulos, ligados ou não. Só quem pode gerenciar os módulos.
export async function listAllModulesHandler(): Promise<ListModulesResult> {
  const authz = await authorizeActor("tests.modules.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }
  return listModuleSummaries("all");
}
