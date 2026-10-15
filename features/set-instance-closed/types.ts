import type { OperationResult } from "@venore/plugin-sdk";

export type SetInstanceClosedCommand = { instanceId: string; closed: boolean; actorId: string };
export type SetInstanceClosedInput = Omit<SetInstanceClosedCommand, "actorId">;
export type SetInstanceClosedResult = OperationResult<{ instanceId: string; closed: boolean }>;
