import { getCurrentUser } from "@venore/plugin-sdk/auth";
import type { OperationResult } from "@venore/plugin-sdk";
import { listPublishedSets } from "../../platform/content/store";

export type PublishedSetOption = { id: string; title: string; version: number; isDefault: boolean };

// Conjuntos de perguntas PUBLICADOS de um módulo, para quem cria uma aplicação escolher qual usar.
// Só logado (quem cria aplicação é admin de equipe); o conteúdo em si não é exposto aqui.
export async function listPublishedSetsHandler(input: { moduleId: string }): Promise<OperationResult<PublishedSetOption[]>> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return { success: true, data: await listPublishedSets(input.moduleId) };
}
