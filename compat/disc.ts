import { createInstance } from "../features/create-instance/service";
import { getResultExternal } from "../features/get-result/service";
import { listInstanceResultsExternal } from "../features/list-instance-results/service";
import { describeDiscProfile } from "../modules/disc/engine/questions";
import type { DiscScoreResult } from "../modules/disc/engine/score-disc";
import type { OperationResult } from "@venore/plugin-sdk";

// COMPATIBILIDADE com o antigo @venore/plugin-disc: o plugin de vagas consome estas três funções
// (shared/disc-bridge.ts) com estes formatos. Ficam finas, em cima da API genérica, até o vagas
// migrar para createTestInstanceExternal / listTestInstanceResultsExternal / getTestResultExternal.
// Não acrescentar nada novo aqui — API nova vai na genérica.

export type DiscInstanceExternal = { id: string; shareSlug: string };

export async function createDiscInstanceExternal(command: {
  environmentLabel: string;
  actorId: null;
  redirectUrl: string;
  externalRef: string;
}): Promise<OperationResult<DiscInstanceExternal>> {
  const result = await createInstance({
    testId: "disc",
    contextLabel: command.environmentLabel,
    actorId: command.actorId,
    redirectUrl: command.redirectUrl,
    externalRef: command.externalRef,
    // Candidato de vaga: responde sem login, informando nome e e-mail, e NÃO vê o resultado (o RH vê).
    identityMode: "identified",
    showResultToParticipant: false,
  });
  if (!result.success) return result;
  return { success: true, data: { id: result.data.id, shareSlug: result.data.shareSlug } };
}

export type DiscReportSummaryExternal = { id: string; profileKey: string; profileKeySecondary: string; createdAt: Date };

export async function listInstanceReportsExternal(instanceId: string): Promise<OperationResult<DiscReportSummaryExternal[]>> {
  const result = await listInstanceResultsExternal(instanceId);
  if (!result.success) return result;
  return {
    success: true,
    data: result.data.results.map((row) => ({
      id: row.id,
      profileKey: row.headline,
      profileKeySecondary: row.headlineSecondary ?? "",
      createdAt: row.createdAt,
    })),
  };
}

export type DiscReportViewExternal = {
  id: string;
  environmentLabel: string;
  dataset: DiscScoreResult;
  createdAt: Date;
  moreProfile: { profile: string; description: string } | undefined;
  lessProfile: { profile: string; description: string } | undefined;
};

export async function getDiscReport(query: { reportId: string }): Promise<OperationResult<DiscReportViewExternal>> {
  const result = await getResultExternal(query.reportId);
  if (!result.success) return result;
  if (result.data.testId !== "disc") {
    return { success: false, error: { code: "not_found", message: "Relatório não encontrado." } };
  }
  const dataset = result.data.dataset as DiscScoreResult;
  return {
    success: true,
    data: {
      id: result.data.id,
      environmentLabel: result.data.contextLabel,
      dataset,
      createdAt: result.data.createdAt,
      moreProfile: describeDiscProfile(dataset.more.profile),
      lessProfile: describeDiscProfile(dataset.less.profile),
    },
  };
}
