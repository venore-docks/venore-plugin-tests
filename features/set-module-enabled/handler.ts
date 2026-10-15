import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { setModuleEnabledService } from "./service";
import type { SetModuleEnabledInput, SetModuleEnabledResult } from "./types";

// Ligar/desligar módulo é decisão de administrador (permissão tests.modules.manage, declarada no
// manifest). Desligar não apaga resultados — ver platform/modules/activation.ts.
export async function setModuleEnabledHandler(input: SetModuleEnabledInput): Promise<SetModuleEnabledResult> {
  const authz = await authorizeActor("tests.modules.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }
  return setModuleEnabledService({ ...input, actorId: authz.actorId });
}
