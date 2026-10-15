import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { setInstanceClosed } from "./service";
import type { SetInstanceClosedInput, SetInstanceClosedResult } from "./types";

export async function setInstanceClosedHandler(input: SetInstanceClosedInput): Promise<SetInstanceClosedResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return setInstanceClosed({ ...input, actorId: currentUser.data.id });
}
