import type { OperationResult } from "@venore/plugin-sdk";

export type MyResultSummary = {
  id: string;
  testId: string;
  testName: string;
  contextLabel: string;
  // Resumo já formatado pelo módulo ("Persistente (Sc)"); cai no headline cru se o módulo não descreve.
  label: string;
  createdAt: Date;
};

export type ListMyResultsResult = OperationResult<MyResultSummary[]>;
