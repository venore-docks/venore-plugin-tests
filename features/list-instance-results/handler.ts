import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { listInstanceResults } from "./service";
import type { ListInstanceResultsResult } from "./types";

export async function listInstanceResultsHandler(input: { instanceId: string }): Promise<ListInstanceResultsResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return listInstanceResults({ instanceId: input.instanceId, actorId: currentUser.data.id });
}
