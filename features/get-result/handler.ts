import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { getResult } from "./service";
import type { GetResultResult } from "./types";

// A sessão (quando existe) e os resultados que o navegador ganhou ao responder sem login entram
// como contexto de acesso — quem chama (a página) lê o cookie e repassa. O link sozinho não abre.
export async function getResultHandler(input: { resultId: string; capabilityResultIds?: string[] }): Promise<GetResultResult> {
  const currentUser = await getCurrentUser();
  const viewerId = currentUser.success && currentUser.data ? currentUser.data.id : null;
  return getResult({ resultId: input.resultId, viewerId, capabilityResultIds: input.capabilityResultIds ?? [] });
}
