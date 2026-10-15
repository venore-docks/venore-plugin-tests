import type { OperationResult } from "@venore/plugin-sdk";
import type { TestTeamRecord } from "../../contracts/types";

export type CreateTeamCommand = { name: string; description?: string | null; actorId: string };
export type CreateTeamInput = Omit<CreateTeamCommand, "actorId">;
export type CreateTeamResult = OperationResult<TestTeamRecord>;
