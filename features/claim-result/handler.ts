import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { claimResult } from "./service";
import type { ClaimResultInput, ClaimResultResult } from "./types";

export async function claimResultHandler(input: ClaimResultInput): Promise<ClaimResultResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado para salvar o resultado." } };
  }
  return claimResult({ ...input, actorId: currentUser.data.id });
}
