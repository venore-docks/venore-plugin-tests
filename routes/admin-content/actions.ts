"use server";

import { revalidatePath } from "next/cache";
import {
  createStarterTestQuestionSet,
  createTestQuestionSet,
  deleteTestQuestionSet,
  duplicateTestQuestionSet,
  publishTestQuestionSet,
  saveTestQuestionSetDraft,
  setDefaultTestQuestionSet,
} from "../../index";

// Ações do editor de conteúdo. A permissão (tests.content.manage) é conferida DENTRO de cada handler
// do plugin — estas ações só repassam e revalidam as telas.

export type ActionState = { error: string | null };
export type SaveDraftActionState = { error: string | null; publishProblems?: string[]; hasUnpublishedChanges?: boolean };

function refresh(moduleId: string, setId?: string) {
  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/conteudo/${moduleId}`);
  if (setId) revalidatePath(`/admin/tests/conteudo/${moduleId}/${setId}`);
}

export async function createStarterAction(moduleId: string): Promise<ActionState & { setId?: string }> {
  const result = await createStarterTestQuestionSet({ moduleId });
  if (!result.success) return { error: result.error.message };
  refresh(moduleId);
  return { error: null, setId: result.data.id };
}

export async function createSetAction(moduleId: string, title: string): Promise<ActionState & { setId?: string }> {
  const result = await createTestQuestionSet({ moduleId, title });
  if (!result.success) return { error: result.error.message };
  refresh(moduleId);
  return { error: null, setId: result.data.id };
}

export async function saveDraftAction(
  moduleId: string,
  setId: string,
  payload: { title: string; description: string; content: unknown },
): Promise<SaveDraftActionState> {
  const result = await saveTestQuestionSetDraft({ setId, title: payload.title, description: payload.description, content: payload.content });
  if (!result.success) return { error: result.error.message };
  refresh(moduleId, setId);
  return { error: null, publishProblems: result.data.publishProblems.map((problem) => problem.message), hasUnpublishedChanges: result.data.hasUnpublishedChanges };
}

export async function publishAction(moduleId: string, setId: string): Promise<ActionState & { version?: number }> {
  const result = await publishTestQuestionSet({ setId });
  if (!result.success) return { error: result.error.message };
  refresh(moduleId, setId);
  return { error: null, version: result.data.version };
}

export async function setDefaultAction(moduleId: string, setId: string): Promise<ActionState> {
  const result = await setDefaultTestQuestionSet({ setId });
  if (!result.success) return { error: result.error.message };
  refresh(moduleId, setId);
  return { error: null };
}

export async function duplicateAction(moduleId: string, setId: string): Promise<ActionState & { setId?: string }> {
  const result = await duplicateTestQuestionSet({ setId });
  if (!result.success) return { error: result.error.message };
  refresh(moduleId);
  return { error: null, setId: result.data.id };
}

export async function deleteAction(moduleId: string, setId: string): Promise<ActionState & { action?: "deleted" | "archived" }> {
  const result = await deleteTestQuestionSet({ setId });
  if (!result.success) return { error: result.error.message };
  refresh(moduleId);
  return { error: null, action: result.data.action };
}
