import { getModule } from "../../platform/modules/registry";
import { isTeamAdmin, isTeamMember } from "../../platform/team-access";
import { findInstanceHeader, findResultsByInstance } from "./store";
import type { InstanceResultSummary, InstanceResultsView, ListInstanceResultsQuery, ListInstanceResultsResult } from "./types";

async function buildView(instanceId: string, canManage: boolean): Promise<ListInstanceResultsResult> {
  const header = await findInstanceHeader(instanceId);
  if (!header) {
    return { success: false, error: { code: "not_found", message: "Aplicação não encontrada." } };
  }
  const module = getModule(header.testId);
  const rows = await findResultsByInstance(instanceId);
  // Módulos aggregateOnly (clima): nenhuma linha individual sai daqui.
  const individualHidden = module?.aggregateOnly === true;
  const results: InstanceResultSummary[] = individualHidden ? [] : rows.map((row) => ({
    ...row,
    label: module?.describeHeadline?.(row.headline, row.headlineSecondary) ?? row.headline,
  }));
  const view: InstanceResultsView = {
    instanceId: header.id,
    testId: header.testId,
    title: header.title,
    contextLabel: header.contextLabel,
    teamId: header.teamId,
    canManage,
    total: rows.length,
    individualHidden,
    results,
  };
  return { success: true, data: view };
}

// Aplicação pessoal (teamId nulo) não tem listagem agregada: não há "membro" pra checar. Só o
// plugin consumidor que a criou (vagas) lista, por listInstanceResultsExternal.
export async function listInstanceResults(query: ListInstanceResultsQuery): Promise<ListInstanceResultsResult> {
  const header = await findInstanceHeader(query.instanceId);
  if (!header) {
    return { success: false, error: { code: "not_found", message: "Aplicação não encontrada." } };
  }
  if (!header.teamId) {
    return { success: false, error: { code: "forbidden", message: "Aplicação pessoal não tem listagem agregada." } };
  }
  if (!(await isTeamMember(header.teamId, query.actorId))) {
    return { success: false, error: { code: "forbidden", message: "Você não faz parte desta equipe." } };
  }
  return buildView(query.instanceId, await isTeamAdmin(header.teamId, query.actorId));
}

// BYPASS de ownership — só para plugin consumidor (ex: vagas) que criou a aplicação via
// createTestInstanceExternal e já validou a própria permissão de negócio antes de chamar
// (ex: vagas.applications.review). Nunca chamar de ação/UI sem checar autorização antes.
export async function listInstanceResultsExternal(instanceId: string): Promise<ListInstanceResultsResult> {
  return buildView(instanceId, false);
}
