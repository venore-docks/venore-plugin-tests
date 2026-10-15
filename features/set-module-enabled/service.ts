import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { setModuleEnabled } from "../../platform/modules/activation";
import { getModule } from "../../platform/modules/registry";
import type { SetModuleEnabledCommand, SetModuleEnabledResult } from "./types";

export async function setModuleEnabledService(command: SetModuleEnabledCommand): Promise<SetModuleEnabledResult> {
  const handle = beginOperation({
    useCase: "tests.set-module-enabled",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  if (!getModule(command.moduleId)) {
    const error = { code: "not_found", message: "Módulo de teste não encontrado." };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  }

  await setModuleEnabled(command.moduleId, command.enabled, command.actorId);
  endOperation(handle, { success: true });
  return { success: true, data: { moduleId: command.moduleId, enabled: command.enabled } };
}
