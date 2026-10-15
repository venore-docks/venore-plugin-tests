import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { reopenResult } from "./service";
import type { ReopenResultInput, ReopenResultResult } from "./types";

export async function reopenResultHandler(input: ReopenResultInput): Promise<ReopenResultResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return reopenResult({ ...input, actorId: currentUser.data.id });
}
