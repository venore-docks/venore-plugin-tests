import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { listMyTeams } from "./service";
import type { ListMyTeamsResult } from "./types";

export async function listMyTeamsHandler(): Promise<ListMyTeamsResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return listMyTeams(currentUser.data.id);
}
