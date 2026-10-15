import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { getTeam } from "./service";
import type { GetTeamResult } from "./types";

export async function getTeamHandler(input: { teamId: string }): Promise<GetTeamResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return getTeam({ teamId: input.teamId, actorId: currentUser.data.id });
}
