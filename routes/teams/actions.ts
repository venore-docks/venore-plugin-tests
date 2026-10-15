"use server";

import { isPluginActive } from "@venore/plugin-sdk";
import { createTestTeam } from "../../index";
import type { CreateTeamResult } from "../../index";

export type CreateTeamActionState = { error: string | null };

export async function createTeamAction(_prevState: CreateTeamActionState, formData: FormData): Promise<CreateTeamActionState> {
  if (!(await isPluginActive("tests"))) {
    return { error: "O plugin Testes está desabilitado." };
  }

  const result: CreateTeamResult = await createTestTeam({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
  });

  if (!result.success) {
    return { error: result.error.message };
  }

  return { error: null };
}
