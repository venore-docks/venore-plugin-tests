import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { getInstanceAggregate } from "./service";
import type { GetInstanceAggregateResult } from "./types";

export async function getInstanceAggregateHandler(input: { instanceId: string }): Promise<GetInstanceAggregateResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: { code: "unauthenticated", message: "É preciso estar logado." } };
  }
  return getInstanceAggregate({ instanceId: input.instanceId, actorId: currentUser.data.id });
}
