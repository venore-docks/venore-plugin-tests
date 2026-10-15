import { authorizeActor } from "@venore/plugin-sdk/rbac";
import {
  createQuestionSet,
  createStarterQuestionSet,
  deleteQuestionSet,
  duplicateQuestionSet,
  getQuestionSet,
  listQuestionSets,
  publishQuestionSet,
  saveDraft,
  setDefaultQuestionSet,
} from "./service";
import type {
  CreateQuestionSetInput,
  CreateQuestionSetResult,
  CreateStarterInput,
  CreateStarterResult,
  DeleteInput,
  DeleteResult,
  DuplicateInput,
  DuplicateResult,
  GetQuestionSetResult,
  ListQuestionSetsResult,
  PublishInput,
  PublishResult,
  SaveDraftInput,
  SaveDraftResult,
  SetDefaultInput,
  SetDefaultResult,
} from "./types";

// Editar o conteúdo dos testes é função de quem tem a permissão tests.content.manage (declarada no
// manifest) — administradores. Nenhum caminho de leitura/escrita deste feature é público.
const PERMISSION = "tests.content.manage";

type Gate = { ok: true; actorId: string } | { ok: false; error: { code: string; message: string } };

async function gate(): Promise<Gate> {
  const authz = await authorizeActor(PERMISSION);
  return authz.authorized ? { ok: true, actorId: authz.actorId } : { ok: false, error: authz.error };
}

export async function listQuestionSetsHandler(input: { moduleId: string }): Promise<ListQuestionSetsResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return listQuestionSets(input.moduleId);
}

export async function getQuestionSetHandler(input: { setId: string }): Promise<GetQuestionSetResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return getQuestionSet(input.setId);
}

export async function createQuestionSetHandler(input: CreateQuestionSetInput): Promise<CreateQuestionSetResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return createQuestionSet(input, access.actorId);
}

export async function saveDraftHandler(input: SaveDraftInput): Promise<SaveDraftResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return saveDraft(input, access.actorId);
}

export async function publishQuestionSetHandler(input: PublishInput): Promise<PublishResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return publishQuestionSet(input, access.actorId);
}

export async function setDefaultQuestionSetHandler(input: SetDefaultInput): Promise<SetDefaultResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return setDefaultQuestionSet(input);
}

export async function duplicateQuestionSetHandler(input: DuplicateInput): Promise<DuplicateResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return duplicateQuestionSet(input, access.actorId);
}

export async function deleteQuestionSetHandler(input: DeleteInput): Promise<DeleteResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return deleteQuestionSet(input);
}

export async function createStarterQuestionSetHandler(input: CreateStarterInput): Promise<CreateStarterResult> {
  const access = await gate();
  if (!access.ok) return { success: false, error: access.error };
  return createStarterQuestionSet(input, access.actorId);
}
