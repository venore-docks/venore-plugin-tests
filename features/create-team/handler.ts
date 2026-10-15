import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { createTeam } from "./service";
import { validateCreateTeamInput } from "./validation";
import type { CreateTeamInput, CreateTeamResult } from "./types";

export async function createTeamHandler(input: CreateTeamInput): Promise<CreateTeamResult> {
  const validationError = validateCreateTeamInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado para criar uma equipe." } };
  }

  return createTeam({ ...input, actorId: currentUser.data.id });
}
