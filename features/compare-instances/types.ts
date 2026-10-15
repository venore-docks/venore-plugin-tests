import type { OperationResult } from "@venore/plugin-sdk";
import type { Comparison } from "./match";

export type CompareInstancesQuery = { teamId: string; instanceAId: string; instanceBId: string; actorId: string };

export type InstanceHeader = { id: string; title: string | null; contextLabel: string; testId: string; createdAt: Date };

export type CompareInstancesView = {
  a: InstanceHeader;
  b: InstanceHeader;
  comparison: Comparison;
  // Os contextos diferentes tornam a comparação menos confiável — a tela avisa.
  sameContext: boolean;
};

export type CompareInstancesResult = OperationResult<CompareInstancesView>;
