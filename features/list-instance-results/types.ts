import type { OperationResult } from "@venore/plugin-sdk";

export type InstanceResultSummary = {
  id: string;
  headline: string;
  headlineSecondary: string | null;
  // Resumo já formatado pelo módulo ("Persistente (Sc)").
  label: string;
  participantName: string | null;
  participantEmail: string | null;
  createdAt: Date;
};

export type InstanceResultsView = {
  instanceId: string;
  testId: string;
  title: string | null;
  contextLabel: string;
  teamId: string | null;
  // O viewer pode reabrir respostas (admin da equipe)?
  canManage: boolean;
  // Total de respostas (mesmo quando as individuais estão ocultas).
  total: number;
  // Pesquisa anônima: não existe lista por pessoa — só o agregado (get-instance-aggregate).
  individualHidden: boolean;
  results: InstanceResultSummary[];
};

export type ListInstanceResultsQuery = { instanceId: string; actorId: string };
export type ListInstanceResultsResult = OperationResult<InstanceResultsView>;
