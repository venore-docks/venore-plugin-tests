import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { createInstance } from "./service";
import type { CreateInstanceInput, CreateInstanceResult } from "./types";

// Fluxo de UI: exige login. O plugin consumidor (vagas) usa createInstance direto, por
// createTestInstanceExternal no barrel, sem sessão.
export async function createInstanceHandler(input: CreateInstanceInput): Promise<CreateInstanceResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado para gerar um link de teste." } };
  }
  return createInstance({ ...input, actorId: currentUser.data.id });
}
