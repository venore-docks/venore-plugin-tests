import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { submitAttempt } from "./service";
import type { SubmitAttemptInput, SubmitAttemptResult } from "./types";

// Sem authorizeActor de propósito: quem responde por link de equipe ou de vaga NÃO tem login
// (identifica-se com nome e e-mail). O que exige conta é decidido pelo modo de identificação da
// aplicação, dentro do service. Com sessão, a resposta nasce vinculada à conta.
export async function submitAttemptHandler(input: SubmitAttemptInput): Promise<SubmitAttemptResult> {
  const currentUser = await getCurrentUser();
  const user = currentUser.success && currentUser.data ? currentUser.data : null;
  return submitAttempt({
    ...input,
    actorId: user?.id ?? null,
    actorName: user?.name ?? null,
    actorEmail: user?.email ?? null,
  });
}
