import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { findDefaultPublished, findLatestPublished } from "../../platform/content/store";
import { isModuleEnabled } from "../../platform/modules/activation";
import { getModule } from "../../platform/modules/registry";
import { isTeamAdmin } from "../../platform/team-access";
import { validateContextLabel } from "../../shared/identity";
import { findInstanceByExternalRef, insertInstanceWithUniqueSlug } from "./store";
import type { IdentityMode } from "../../contracts/types";
import type { CreateInstanceCommand, CreateInstanceResult } from "./types";

// Só caminho relativo do próprio site — nunca URL absoluta (evita open redirect via link de convite).
function isSafeRedirect(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//") && !url.includes("\\");
}

export async function createInstance(command: CreateInstanceCommand): Promise<CreateInstanceResult> {
  const handle = beginOperation({
    useCase: "tests.create-instance",
    actor: command.actorId ? { id: command.actorId, type: "user" } : { id: "anonymous", type: "system" },
    kind: "write",
  });

  const fail = (code: string, message: string): CreateInstanceResult => {
    const error = { code, message };
    endOperation(handle, { success: false, error });
    return { success: false, error };
  };

  // Idempotência para plugin consumidor: mesma referência externa → devolve a instância que já existe.
  if (command.externalRef) {
    const existing = await findInstanceByExternalRef(command.externalRef);
    if (existing) {
      endOperation(handle, { success: true });
      return { success: true, data: existing };
    }
  }

  if (!getModule(command.testId)) {
    return fail("module_not_found", "Esse teste não existe.");
  }
  if (!(await isModuleEnabled(command.testId))) {
    return fail("module_disabled", "Esse teste está desativado no momento.");
  }

  const testModule = getModule(command.testId)!;

  const context = validateContextLabel(command.contextLabel);
  if (!context.ok) {
    return fail(context.code, context.message);
  }
  const title = command.title?.trim() || null;
  if (title && title.length > 120) {
    return fail("title_too_long", "O título da aplicação pode ter até 120 caracteres.");
  }
  if (command.redirectUrl && !isSafeRedirect(command.redirectUrl)) {
    return fail("invalid_redirect", "O redirecionamento precisa ser um caminho do próprio site.");
  }

  if (command.teamId) {
    if (!command.actorId) {
      return fail("forbidden", "Uma instância de equipe precisa de um ator autenticado.");
    }
    if (!(await isTeamAdmin(command.teamId, command.actorId))) {
      return fail("forbidden", "Só quem administra a equipe pode criar aplicações do teste.");
    }
  }

  // Módulos authored: fixa o conjunto e a versão publicada (escolhido, ou o padrão do módulo).
  let questionSetId: string | null = null;
  let questionSetVersion: number | null = null;
  if (testModule.contentKind === "authored") {
    const chosen = command.questionSetId ? await findLatestPublished(command.questionSetId) : await findDefaultPublished(testModule.id);
    if (!chosen || ("moduleId" in chosen && chosen.moduleId !== testModule.id)) {
      return fail("no_content", "Este teste ainda não tem perguntas publicadas. Peça a um administrador para publicar um conjunto de perguntas.");
    }
    questionSetId = chosen.setId;
    questionSetVersion = chosen.version;
  }

  // Padrão de identificação: o do módulo (clima = anônimo), senão equipe/vaga = identificado e pessoal logada = login.
  const identityMode: IdentityMode = command.identityMode ?? testModule.defaultIdentityMode ?? (!command.teamId && command.actorId ? "login" : "identified");

  const instance = await insertInstanceWithUniqueSlug({
    testId: command.testId,
    teamId: command.teamId ?? null,
    title,
    contextLabel: context.value,
    createdByUserId: command.actorId,
    redirectUrl: command.redirectUrl ?? null,
    externalRef: command.externalRef ?? null,
    identityMode,
    showResultToParticipant: command.showResultToParticipant ?? testModule.defaultShowResultToParticipant ?? true,
    questionSetId,
    questionSetVersion,
  });

  endOperation(handle, { success: true });
  return { success: true, data: instance };
}
