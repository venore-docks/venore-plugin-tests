import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { isTeamAdmin } from "../../platform/team-access";
import { deleteResult, findResultOwnership } from "./store";
import type { ReopenResultCommand, ReopenResultResult } from "./types";

// "Reabrir" = apagar a resposta de uma pessoa naquela aplicação para ela poder responder de novo
// (e-mail digitado errado, teste interrompido, engano). Só admin da equipe da aplicação. O resultado
// apagado não tem volta — a UI confirma antes. Não existe reabrir em aplicação pessoal ou de
// plugin consumidor: lá não há "equipe" para decidir.
export async function reopenResult(command: ReopenResultCommand): Promise<ReopenResultResult> {
  const handle = beginOperation({
    useCase: "tests.reopen-result",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const fail = (code: string, message: string): ReopenResultResult => {
    const error = { code, message };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  };

  const ownership = await findResultOwnership(command.resultId);
  if (!ownership) return fail("not_found", "Resultado não encontrado.");
  if (!ownership.instanceId || !ownership.teamId) return fail("forbidden", "Só dá para reabrir respostas de uma aplicação de equipe.");
  if (!(await isTeamAdmin(ownership.teamId, command.actorId))) {
    return fail("forbidden", "Só quem administra a equipe pode reabrir uma resposta.");
  }

  await deleteResult(command.resultId);
  endOperation(handle, { success: true });
  return { success: true, data: { resultId: command.resultId, instanceId: ownership.instanceId } };
}
