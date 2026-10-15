import { aggregateAnswers, MIN_RESPONSES_FOR_ANONYMOUS } from "../../platform/content/aggregate";
import { findPublishedVersion } from "../../platform/content/store";
import type { QuestionnaireAnswers } from "../../platform/content/types";
import { getModule } from "../../platform/modules/registry";
import { isTeamMember } from "../../platform/team-access";
import { findDatasets, findInstanceForAggregate } from "./store";
import type { GetInstanceAggregateResult } from "./types";

function answersOf(dataset: unknown): QuestionnaireAnswers | null {
  const answers = (dataset as { answers?: unknown } | null)?.answers;
  return typeof answers === "object" && answers !== null && !Array.isArray(answers) ? (answers as QuestionnaireAnswers) : null;
}

async function build(instanceId: string): Promise<GetInstanceAggregateResult> {
  const fail = (code: string, message: string): GetInstanceAggregateResult => ({ success: false, error: { code, message } });

  const instance = await findInstanceForAggregate(instanceId);
  if (!instance) return fail("not_found", "Aplicação não encontrada.");
  const module = getModule(instance.testId);
  if (!module || module.contentKind !== "authored") return fail("not_supported", "Este teste não tem resultado agregado por pergunta.");
  if (instance.questionSetId === null || instance.questionSetVersion === null) return fail("no_content", "Esta aplicação não tem conteúdo fixado.");

  const published = await findPublishedVersion(instance.questionSetId, instance.questionSetVersion);
  if (!published) return fail("no_content", "O conteúdo desta aplicação não está mais disponível.");

  const datasets = await findDatasets(instanceId);
  const answersList = datasets.map(answersOf).filter((answers): answers is QuestionnaireAnswers => answers !== null);
  if (answersList.length === 0 && datasets.length > 0) return fail("not_supported", "Este teste não guarda as respostas por pergunta.");

  const guarded = instance.identityMode === "anonymous" || module.aggregateOnly === true;
  const insufficient = guarded && answersList.length < MIN_RESPONSES_FOR_ANONYMOUS;

  return {
    success: true,
    data: {
      instanceId: instance.id,
      testId: instance.testId,
      title: instance.title,
      contextLabel: instance.contextLabel,
      total: answersList.length,
      minResponses: MIN_RESPONSES_FOR_ANONYMOUS,
      insufficient,
      // Com respostas de menos, NADA do conteúdo agregado sai (nem contagens): só o total.
      questions: insufficient ? [] : aggregateAnswers(published.content, answersList),
    },
  };
}

// Qualquer membro da equipe da aplicação vê o agregado.
export async function getInstanceAggregate(query: { instanceId: string; actorId: string }): Promise<GetInstanceAggregateResult> {
  const instance = await findInstanceForAggregate(query.instanceId);
  if (!instance) return { success: false, error: { code: "not_found", message: "Aplicação não encontrada." } };
  if (!instance.teamId || !(await isTeamMember(instance.teamId, query.actorId))) {
    return { success: false, error: { code: "forbidden", message: "Você não faz parte desta equipe." } };
  }
  return build(query.instanceId);
}

// BYPASS — só para plugin consumidor que já checou a própria permissão (ver docs/api-publica.md).
export async function getInstanceAggregateExternal(instanceId: string): Promise<GetInstanceAggregateResult> {
  return build(instanceId);
}
