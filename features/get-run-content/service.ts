import { resolveContent } from "../../platform/content/resolve";
import { toRunnerContent } from "../../platform/content/runner-content";
import { getModule } from "../../platform/modules/registry";
import type { GetRunContentQuery, GetRunContentResult } from "./types";

// As perguntas que o navegador de quem vai responder recebe: a versão publicada fixada (aplicação) ou
// a padrão do módulo (avulso), SEM gabarito e SEM os campos de pontuação (toRunnerContent).
export async function getRunContent(query: GetRunContentQuery): Promise<GetRunContentResult> {
  const module = getModule(query.moduleId);
  if (!module) return { success: false, error: { code: "module_not_found", message: "Esse teste não existe." } };

  const resolved = await resolveContent(module, query.instanceId);
  if (!resolved.ok) return { success: false, error: resolved.error };
  const { published } = resolved.value;

  return { success: true, data: { content: published ? toRunnerContent(published.content, { setId: published.setId, version: published.version }) : null } };
}
