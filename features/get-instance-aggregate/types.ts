import type { OperationResult } from "@venore/plugin-sdk";
import type { QuestionAggregate } from "../../platform/content/aggregate";

export type InstanceAggregateView = {
  instanceId: string;
  testId: string;
  title: string | null;
  contextLabel: string;
  total: number;
  // Mínimo de respostas para mostrar o agregado de uma pesquisa anônima.
  minResponses: number;
  // Respostas de menos: o agregado fica oculto (deduzir quem respondeu o quê seria fácil).
  insufficient: boolean;
  questions: QuestionAggregate[];
};

export type GetInstanceAggregateResult = OperationResult<InstanceAggregateView>;
