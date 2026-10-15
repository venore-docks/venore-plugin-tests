import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { isTeamAdmin } from "../../platform/team-access";
import { findInstanceTeam, updateClosedAt } from "./store";
import type { SetInstanceClosedCommand, SetInstanceClosedResult } from "./types";

// Encerrar o link: nenhuma resposta nova entra (a tela do teste e o envio recusam), mas os
// resultados já gravados continuam. Reabrir o link desfaz. Só admin da equipe da aplicação.
export async function setInstanceClosed(command: SetInstanceClosedCommand): Promise<SetInstanceClosedResult> {
  const handle = beginOperation({
    useCase: "tests.set-instance-closed",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const fail = (code: string, message: string): SetInstanceClosedResult => {
    const error = { code, message };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  };

  const instance = await findInstanceTeam(command.instanceId);
  if (!instance) return fail("not_found", "Aplicação não encontrada.");
  if (!instance.teamId) return fail("forbidden", "Só dá para encerrar o link de uma aplicação de equipe.");
  if (!(await isTeamAdmin(instance.teamId, command.actorId))) {
    return fail("forbidden", "Só quem administra a equipe pode encerrar ou reabrir o link.");
  }

  await updateClosedAt(command.instanceId, command.closed ? new Date() : null);
  endOperation(handle, { success: true });
  return { success: true, data: { instanceId: command.instanceId, closed: command.closed } };
}
