import type { OperationResult } from "@venore/plugin-sdk";
import type { TestResultRecord } from "../../contracts/types";

export type ClaimResultCommand = { resultId: string; actorId: string };
export type ClaimResultInput = Omit<ClaimResultCommand, "actorId">;
export type ClaimResultResult = OperationResult<TestResultRecord>;
