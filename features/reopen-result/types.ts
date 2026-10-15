import type { OperationResult } from "@venore/plugin-sdk";

export type ReopenResultCommand = { resultId: string; actorId: string };
export type ReopenResultInput = Omit<ReopenResultCommand, "actorId">;
export type ReopenResultResult = OperationResult<{ resultId: string; instanceId: string }>;
