import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { listMyResults } from "./service";
import type { ListMyResultsResult } from "./types";

export async function listMyResultsHandler(): Promise<ListMyResultsResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return listMyResults(currentUser.data.id);
}
