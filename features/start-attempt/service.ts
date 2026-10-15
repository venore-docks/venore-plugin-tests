import { findPublishedVersion } from "../../platform/content/store";
import { isModuleEnabled } from "../../platform/modules/activation";
import { getModule } from "../../platform/modules/registry";
import { findInstanceForSubmit } from "../submit-attempt/store";
import { findOpenAttempt, insertAttempt } from "./store";
import type { AttemptClock, StartAttemptCommand, StartAttemptResult } from "./types";

// Abre uma TENTATIVA com tempo limite: o servidor guarda quando começou e quando expira. Sem tempo
// limite no conjunto, não há tentativa (devolve null e a tela segue sem cronômetro).
export async function startAttempt(command: StartAttemptCommand): Promise<StartAttemptResult> {
  const fail = (code: string, message: string): StartAttemptResult => ({ success: false, error: { code, message } });

  const module = getModule(command.moduleId);
  if (!module || module.contentKind !== "authored") return fail("module_not_found", "Esse teste não existe.");
  if (!(await isModuleEnabled(module.id))) return fail("module_disabled", "Esse teste está desativado no momento.");

  const published = await findPublishedVersion(command.contentRef.setId, command.contentRef.version);
  if (!published) return fail("no_content", "O conteúdo deste teste não está mais disponível.");

  const limitMinutes = typeof published.content.settings.timeLimitMinutes === "number" ? published.content.settings.timeLimitMinutes : 0;
  if (limitMinutes <= 0) return { success: true, data: null };

  if (command.instanceId) {
    const instance = await findInstanceForSubmit(command.instanceId);
    if (!instance || instance.testId !== module.id) return fail("not_found", "Esta aplicação do teste não existe mais.");
    if (instance.closed) return fail("instance_closed", "Este link foi encerrado — não aceita mais respostas.");
    if (instance.identityMode === "login" && !command.actorId) return fail("unauthenticated", "É preciso estar logado para responder este teste.");
  }

  const now = new Date();

  if (command.existingAttemptId) {
    const existing = await findOpenAttempt(command.existingAttemptId);
    const sameContext =
      existing &&
      existing.moduleId === module.id &&
      existing.instanceId === command.instanceId &&
      existing.questionSetId === published.setId &&
      existing.questionSetVersion === published.version;
    if (sameContext) {
      return { success: true, data: { attemptId: existing.id, expiresAt: existing.expiresAt.toISOString(), serverNow: now.toISOString() } satisfies AttemptClock };
    }
    // Tentativa inexistente/encerrada/de outro teste: abre uma nova abaixo (a resposta antiga não vale).
  }

  const attempt = await insertAttempt({
    moduleId: module.id,
    instanceId: command.instanceId,
    questionSetId: published.setId,
    questionSetVersion: published.version,
    userId: command.actorId,
    expiresAt: new Date(now.getTime() + limitMinutes * 60 * 1000),
  });
  return { success: true, data: { attemptId: attempt.id, expiresAt: attempt.expiresAt.toISOString(), serverNow: now.toISOString() } };
}
