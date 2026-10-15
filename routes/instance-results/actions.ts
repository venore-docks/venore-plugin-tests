"use server";

import { revalidatePath } from "next/cache";
import { isPluginActive } from "@venore/plugin-sdk";
import { exportTestInstanceResults, reopenTestResult } from "../../index";

export type ReopenResultActionState = { error: string | null };

export async function reopenResultAction(teamId: string, instanceId: string, resultId: string): Promise<ReopenResultActionState> {
  if (!(await isPluginActive("tests"))) {
    return { error: "O plugin Testes está desabilitado." };
  }

  const result = await reopenTestResult({ resultId });
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath(`/testes/equipes/${teamId}/${instanceId}`);
  return { error: null };
}

export type ExportCsvActionState = { error: string | null; filename?: string; csv?: string };

// Gera o CSV no servidor (com a checagem de equipe) e devolve o texto; o navegador baixa o arquivo.
export async function exportInstanceCsvAction(instanceId: string): Promise<ExportCsvActionState> {
  if (!(await isPluginActive("tests"))) {
    return { error: "O plugin Testes está desabilitado." };
  }
  const result = await exportTestInstanceResults({ instanceId });
  if (!result.success) {
    return { error: result.error.message };
  }
  return { error: null, filename: result.data.filename, csv: result.data.csv };
}
