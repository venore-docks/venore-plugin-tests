import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { resolveContent } from "../../platform/content/resolve";
import { findPublishedVersion, findSetModuleId, type PublishedContent } from "../../platform/content/store";
import { isModuleEnabled } from "../../platform/modules/activation";
import { getModule } from "../../platform/modules/registry";
import { validateContextLabel, validateParticipant } from "../../shared/identity";
import { findOpenAttempt, markAttemptFinished } from "../start-attempt/store";
import { deleteExpiredUnclaimedResults, findInstanceForSubmit, hasResultForEmail, hasResultForUser, insertResult, isUniqueViolation } from "./store";
import type { ScoreContext } from "../../platform/modules/contract";
import type { SubmitAttemptCommand, SubmitAttemptResult } from "./types";

// Quanto tempo uma resposta AVULSA (sem login) espera o login para ser reivindicada. Depois disso é
// apagada (LGPD: não guardar dado de quem desistiu de se identificar).
const UNCLAIMED_RETENTION_DAYS = 30;

const ALREADY_ANSWERED = {
  code: "already_answered",
  message: "Já existe uma resposta para esta aplicação com este e-mail. Cada pessoa responde uma vez por aplicação — se foi um engano, peça a quem aplicou o teste para reabrir a sua resposta.",
};

export async function submitAttempt(command: SubmitAttemptCommand): Promise<SubmitAttemptResult> {
  const handle = beginOperation({
    useCase: "tests.submit-attempt",
    actor: command.actorId ? { id: command.actorId, type: "user" } : { id: "anonymous", type: "system" },
    kind: "write",
  });

  const fail = (error: { code: string; message: string }): SubmitAttemptResult => {
    endOperation(handle, { success: false, error });
    return { success: false, error };
  };

  const module = getModule(command.moduleId);
  if (!module) {
    return fail({ code: "module_not_found", message: "Esse teste não existe." });
  }
  if (!(await isModuleEnabled(module.id))) {
    return fail({ code: "module_disabled", message: "Esse teste está desativado no momento." });
  }

  const now = new Date();
  await deleteExpiredUnclaimedResults(now);

  const instance = command.instanceId ? await findInstanceForSubmit(command.instanceId) : undefined;
  if (command.instanceId && !instance) {
    return fail({ code: "not_found", message: "Esta aplicação do teste não existe mais." });
  }
  if (instance && instance.testId !== module.id) {
    return fail({ code: "module_mismatch", message: "Esta aplicação é de outro teste." });
  }
  if (instance?.closed) {
    return fail({ code: "instance_closed", message: "Este link foi encerrado — não aceita mais respostas." });
  }
  // Pesquisa anônima: não há como saber QUEM já respondeu — só dá para lembrar, neste navegador, que
  // alguém já respondeu daqui. É uma barreira contra clique repetido, não contra fraude.
  if (instance?.identityMode === "anonymous" && command.deviceAnsweredInstanceIds?.includes(instance.id)) {
    return fail({ code: "already_answered", message: "Este navegador já enviou uma resposta para esta pesquisa. Obrigado por participar!" });
  }

  // --- conteúdo (módulos authored) ---
  let published: PublishedContent | null = null;
  if (module.contentKind === "authored") {
    if (instance) {
      const resolved = await resolveContent(module, instance.id);
      if (!resolved.ok) return fail(resolved.error);
      published = resolved.value.published;
    } else {
      // Avulso: a versão que a tela carregou (a padrão pode ter mudado no meio do teste), desde que
      // seja uma versão publicada de um conjunto DESTE módulo.
      const ref = command.contentRef;
      if (!ref || !Number.isInteger(ref.version) || typeof ref.setId !== "string") {
        return fail({ code: "no_content", message: "Não foi possível identificar as perguntas deste teste. Recarregue a página e tente de novo." });
      }
      if ((await findSetModuleId(ref.setId)) !== module.id) return fail({ code: "no_content", message: "Conteúdo inválido para este teste." });
      published = (await findPublishedVersion(ref.setId, ref.version)) ?? null;
      if (!published) return fail({ code: "no_content", message: "As perguntas deste teste não estão mais disponíveis." });
    }
  }

  // --- tempo limite (medido pelo servidor) ---
  const context: ScoreContext = { content: published?.content ?? null };
  let attemptId: string | null = null;
  const limitMinutes = typeof published?.content.settings.timeLimitMinutes === "number" ? published.content.settings.timeLimitMinutes : 0;
  if (limitMinutes > 0 && published) {
    if (!command.attemptId) return fail({ code: "attempt_required", message: "Este teste tem tempo limite: recarregue a página para começar de novo." });
    const attempt = await findOpenAttempt(command.attemptId);
    const matches =
      attempt &&
      attempt.moduleId === module.id &&
      attempt.instanceId === (instance?.id ?? null) &&
      attempt.questionSetId === published.setId &&
      attempt.questionSetVersion === published.version;
    if (!attempt || !matches) return fail({ code: "attempt_invalid", message: "Esta tentativa não vale mais. Recarregue a página para começar de novo." });
    attemptId = attempt.id;
    context.elapsedSeconds = Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000);
    context.timeLimitSeconds = limitMinutes * 60;
  }

  const answersError = module.validateAnswers(command.answers, context);
  if (answersError) {
    return fail(answersError);
  }

  // O contexto de uma aplicação é de quem a criou; o avulso informa o próprio.
  let contextLabel: string;
  if (instance) {
    contextLabel = instance.contextLabel;
  } else {
    const contextCheck = validateContextLabel(command.contextLabel);
    if (!contextCheck.ok) return fail(contextCheck);
    contextLabel = contextCheck.value;
  }

  let participantName: string | null = null;
  let participantEmail: string | null = null;
  let participantEmailKey: string | null = null;

  if (instance?.identityMode === "login" && !command.actorId) {
    return fail({ code: "unauthenticated", message: "É preciso estar logado para responder este teste." });
  }

  if (instance?.identityMode === "identified") {
    // Quem está logado usa a própria conta por padrão; sem login, nome e e-mail do convite.
    const candidate = command.participant?.email
      ? command.participant
      : { name: command.actorName ?? command.participant?.name ?? null, email: command.actorEmail ?? null };
    const participant = validateParticipant(candidate);
    if (!participant.ok) return fail(participant);
    participantName = participant.name;
    participantEmail = participant.email;
    participantEmailKey = participant.emailKey;
    if (await hasResultForEmail(instance.id, participant.emailKey)) {
      return fail(ALREADY_ANSWERED);
    }
  }

  // Resposta anônima NÃO guarda quem respondeu — nem a conta, mesmo se estiver logado.
  const storedUserId = instance?.identityMode === "anonymous" ? null : command.actorId;
  if (instance && storedUserId && (await hasResultForUser(instance.id, storedUserId))) {
    return fail(ALREADY_ANSWERED);
  }

  const outcome = module.score(command.answers, context);
  const unclaimedExpiresAt =
    !instance && !command.actorId ? new Date(now.getTime() + UNCLAIMED_RETENTION_DAYS * 24 * 60 * 60 * 1000) : null;

  let record;
  try {
    record = await insertResult({
      testId: module.id,
      testVersion: module.version,
      userId: storedUserId,
      instanceId: instance?.id ?? null,
      contextLabel,
      participantName,
      participantEmail,
      participantEmailKey,
      dataset: outcome.dataset,
      headline: outcome.headline,
      headlineSecondary: outcome.headlineSecondary ?? null,
      unclaimedExpiresAt,
      questionSetId: published?.setId ?? null,
      questionSetVersion: published?.version ?? null,
    });
  } catch (error) {
    // Corrida: duas respostas do mesmo e-mail ao mesmo tempo — o índice único segura a segunda.
    if (isUniqueViolation(error)) return fail(ALREADY_ANSWERED);
    throw error;
  }
  if (attemptId) await markAttemptFinished(attemptId);

  const showResult = instance ? instance.showResultToParticipant : true;
  let redirectTo = `/testes/r/${record.id}`;
  if (instance?.redirectUrl) {
    const separator = instance.redirectUrl.includes("?") ? "&" : "?";
    redirectTo = `${instance.redirectUrl}${separator}reportId=${record.id}&resultId=${record.id}`;
  } else if (!showResult) {
    redirectTo = "/testes/concluido";
  }

  endOperation(handle, { success: true });
  return {
    success: true,
    data: {
      id: record.id,
      redirectTo,
      // Acesso temporário no navegador só para quem respondeu sem login uma aplicação que mostra o resultado.
      grantViewAccess: Boolean(instance) && !command.actorId && showResult,
      deviceAnswered: instance?.identityMode === "anonymous",
    },
  };
}
