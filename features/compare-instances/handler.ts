import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { compareInstances } from "./service";
import type { CompareInstancesResult } from "./types";

export async function compareInstancesHandler(input: { teamId: string; instanceAId: string; instanceBId: string }): Promise<CompareInstancesResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return compareInstances({ ...input, actorId: currentUser.data.id });
}
