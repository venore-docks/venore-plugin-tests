import type { ModuleError, TestModule } from "../modules/contract";
import { findDefaultPublished, findInstancePin, findPublishedVersion, type PublishedContent } from "./store";

// Qual conteúdo vale para esta resposta? (módulos "authored")
//  - aplicação (equipe/vaga): SEMPRE o (conjunto, versão) fixado na criação da aplicação — o que o
//    navegador mandar é ignorado;
//  - teste avulso: o conjunto padrão do módulo na versão mais recente publicada.
// Módulo de conteúdo fixo: nada a resolver (content = null).
export type ResolvedContent = { published: PublishedContent | null };

export async function resolveContent(module: TestModule, instanceId: string | null): Promise<{ ok: true; value: ResolvedContent } | { ok: false; error: ModuleError }> {
  if (module.contentKind !== "authored") return { ok: true, value: { published: null } };

  const noContent: ModuleError = {
    code: "no_content",
    message: "Este teste ainda não tem perguntas publicadas. Peça a um administrador para publicar um conjunto de perguntas.",
  };

  if (instanceId) {
    const pin = await findInstancePin(instanceId);
    if (!pin) return { ok: false, error: { code: "not_found", message: "Esta aplicação do teste não existe mais." } };
    if (pin.questionSetId === null || pin.questionSetVersion === null) return { ok: false, error: noContent };
    const published = await findPublishedVersion(pin.questionSetId, pin.questionSetVersion);
    return published ? { ok: true, value: { published } } : { ok: false, error: noContent };
  }

  const published = await findDefaultPublished(module.id);
  return published ? { ok: true, value: { published } } : { ok: false, error: noContent };
}
