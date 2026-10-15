import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { claimResultIfUnowned, findResultById } from "./store";
import type { ClaimResultCommand, ClaimResultResult } from "./types";

export async function claimResult(command: ClaimResultCommand): Promise<ClaimResultResult> {
  const handle = beginOperation({
    useCase: "tests.claim-result",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const fail = (code: string, message: string): ClaimResultResult => {
    const error = { code, message };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  };

  const existing = await findResultById(command.resultId);
  if (!existing) return fail("not_found", "Resultado não encontrado.");
  if (existing.instanceId) return fail("not_claimable", "Resultado de uma aplicação não é vinculado por login.");

  if (existing.userId === command.actorId) {
    endOperation(handle, { success: true });
    return { success: true, data: existing };
  }
  if (existing.userId) return fail("already_claimed", "Este resultado já pertence a outra conta.");

  const claimed = await claimResultIfUnowned(command.resultId, command.actorId);
  if (!claimed) return fail("already_claimed", "Este resultado já pertence a outra conta.");

  endOperation(handle, { success: true });
  return { success: true, data: claimed };
}
