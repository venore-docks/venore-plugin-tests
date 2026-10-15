import type { OperationResult } from "@venore/plugin-sdk";

export type SetModuleEnabledCommand = { moduleId: string; enabled: boolean; actorId: string };
export type SetModuleEnabledInput = Omit<SetModuleEnabledCommand, "actorId">;
export type SetModuleEnabledResult = OperationResult<{ moduleId: string; enabled: boolean }>;
