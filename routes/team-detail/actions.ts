"use server";

import { revalidatePath } from "next/cache";
import { isPluginActive } from "@venore/plugin-sdk";
import { createTestInstance, setTestInstanceClosed } from "../../index";

export type CreateInstanceActionState = { error: string | null };

export async function createInstanceAction(
  teamId: string,
  _prevState: CreateInstanceActionState,
  formData: FormData,
): Promise<CreateInstanceActionState> {
  if (!(await isPluginActive("tests"))) {
    return { error: "O plugin Testes está desabilitado." };
  }

  const result = await createTestInstance({
    testId: String(formData.get("testId") ?? ""),
    teamId,
    title: String(formData.get("title") ?? "") || null,
    contextLabel: String(formData.get("contextLabel") ?? ""),
    questionSetId: String(formData.get("questionSetId") ?? "") || null,
  });

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath(`/testes/equipes/${teamId}`);
  return { error: null };
}

export async function setInstanceClosedAction(teamId: string, instanceId: string, closed: boolean): Promise<{ error: string | null }> {
  if (!(await isPluginActive("tests"))) {
    return { error: "O plugin Testes está desabilitado." };
  }

  const result = await setTestInstanceClosed({ instanceId, closed });
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath(`/testes/equipes/${teamId}`);
  return { error: null };
}
