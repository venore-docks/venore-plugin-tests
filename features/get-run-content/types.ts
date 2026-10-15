import type { OperationResult } from "@venore/plugin-sdk";
import type { RunnerContent } from "../../platform/content/types";

export type GetRunContentQuery = { moduleId: string; instanceId: string | null };
// content = null: módulo de conteúdo fixo (DISC) — o runner tem as perguntas no próprio código.
export type GetRunContentResult = OperationResult<{ content: RunnerContent | null }>;
