import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { exportInstanceResults } from "./service";
import type { ExportInstanceResultsResult } from "./types";

export async function exportInstanceResultsHandler(input: { instanceId: string }): Promise<ExportInstanceResultsResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return exportInstanceResults({ instanceId: input.instanceId, actorId: currentUser.data.id });
}
