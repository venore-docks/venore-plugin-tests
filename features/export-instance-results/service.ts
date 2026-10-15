import { getModule } from "../../platform/modules/registry";
import { isTeamMember } from "../../platform/team-access";
import { toCsv } from "../../shared/csv";
import { findInstanceHeader, findResultsByInstance } from "../list-instance-results/store";
import type { ExportInstanceResultsQuery, ExportInstanceResultsResult } from "./types";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Exporta os resultados de uma aplicação de equipe em planilha (CSV). Membro da equipe. O arquivo
// tem nome e e-mail de quem respondeu: é dado pessoal que sai da plataforma — por isso só membros,
// e o texto de LGPD da identificação já avisa a finalidade.
export async function exportInstanceResults(query: ExportInstanceResultsQuery): Promise<ExportInstanceResultsResult> {
  const header = await findInstanceHeader(query.instanceId);
  if (!header) {
    return { success: false, error: { code: "not_found", message: "Aplicação não encontrada." } };
  }
  if (!header.teamId || !(await isTeamMember(header.teamId, query.actorId))) {
    return { success: false, error: { code: "forbidden", message: "Você não faz parte desta equipe." } };
  }

  const module = getModule(header.testId);
  if (module?.aggregateOnly) {
    return { success: false, error: { code: "forbidden", message: "Pesquisa anônima: não existe planilha por pessoa — veja o resultado agregado na página da aplicação." } };
  }
  const rows = await findResultsByInstance(query.instanceId);
  const csv = toCsv(
    ["Nome", "E-mail", "Resultado", "Resumo", "Resumo secundário", "Teste", "Aplicação", "Contexto", "Data"],
    rows.map((row) => [
      row.participantName,
      row.participantEmail,
      module?.describeHeadline?.(row.headline, row.headlineSecondary) ?? row.headline,
      row.headline,
      row.headlineSecondary,
      module?.name ?? header.testId,
      header.title,
      header.contextLabel,
      row.createdAt.toISOString(),
    ]),
  );

  const base = slugify(`${header.title ?? module?.name ?? header.testId}`) || "resultados";
  return { success: true, data: { filename: `resultados-${base}.csv`, csv } };
}
