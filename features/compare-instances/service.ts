import { getModule } from "../../platform/modules/registry";
import { isTeamMember } from "../../platform/team-access";
import { compareResults, type ComparableResult } from "./match";
import { findComparableResults, findInstanceForCompare } from "./store";
import type { CompareInstancesQuery, CompareInstancesResult } from "./types";

// Compara DUAS aplicações da mesma equipe e do mesmo teste (ex.: 1º e 2º trimestre), casando as
// pessoas pelo e-mail (ou pela conta). Qualquer membro da equipe vê.
export async function compareInstances(query: CompareInstancesQuery): Promise<CompareInstancesResult> {
  const fail = (code: string, message: string): CompareInstancesResult => ({ success: false, error: { code, message } });

  if (query.instanceAId === query.instanceBId) {
    return fail("same_instance", "Escolha duas aplicações diferentes para comparar.");
  }
  if (!(await isTeamMember(query.teamId, query.actorId))) {
    return fail("forbidden", "Você não faz parte desta equipe.");
  }

  const [instanceA, instanceB] = await Promise.all([findInstanceForCompare(query.instanceAId), findInstanceForCompare(query.instanceBId)]);
  if (!instanceA || !instanceB) return fail("not_found", "Aplicação não encontrada.");
  if (instanceA.teamId !== query.teamId || instanceB.teamId !== query.teamId) {
    return fail("forbidden", "As duas aplicações precisam ser desta equipe.");
  }
  if (instanceA.testId !== instanceB.testId) {
    return fail("different_tests", "Só dá para comparar aplicações do mesmo teste.");
  }

  const module = getModule(instanceA.testId);
  if (module?.aggregateOnly) return fail("anonymous", "Pesquisa anônima não permite comparar por pessoa.");
  const toComparable = (row: Awaited<ReturnType<typeof findComparableResults>>[number]): ComparableResult => ({
    id: row.id,
    userId: row.userId,
    participantName: row.participantName,
    participantEmail: row.participantEmail,
    participantEmailKey: row.participantEmailKey,
    label: module?.describeHeadline?.(row.headline, row.headlineSecondary) ?? row.headline,
  });

  const [resultsA, resultsB] = await Promise.all([findComparableResults(instanceA.id), findComparableResults(instanceB.id)]);
  const header = (instance: typeof instanceA) => ({
    id: instance.id,
    title: instance.title,
    contextLabel: instance.contextLabel,
    testId: instance.testId,
    createdAt: instance.createdAt,
  });

  return {
    success: true,
    data: {
      a: header(instanceA),
      b: header(instanceB),
      comparison: compareResults(resultsA.map(toComparable), resultsB.map(toComparable)),
      sameContext: instanceA.contextLabel.trim().toLowerCase() === instanceB.contextLabel.trim().toLowerCase(),
    },
  };
}
