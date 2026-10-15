import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { startAttempt } from "./service";
import type { StartAttemptInput, StartAttemptResult } from "./types";

// Sem authorizeActor de propósito (mesma razão de submit-attempt): quem responde por link de equipe
// ou de vaga não tem login. O modo da aplicação é conferido no service.
export async function startAttemptHandler(input: StartAttemptInput): Promise<StartAttemptResult> {
  const currentUser = await getCurrentUser();
  return startAttempt({ ...input, actorId: currentUser.success && currentUser.data ? currentUser.data.id : null });
}
