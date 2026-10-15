import type { OperationResult } from "@venore/plugin-sdk";

export type ExportInstanceResultsQuery = { instanceId: string; actorId: string };
export type ExportInstanceResultsView = { filename: string; csv: string };
export type ExportInstanceResultsResult = OperationResult<ExportInstanceResultsView>;
