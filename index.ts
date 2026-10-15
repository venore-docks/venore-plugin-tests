// PORTA PÚBLICA do plugin Testes (API v1) — o único ponto por onde outro plugin (ex: vagas) conversa
// com este via importActivePluginBarrel("tests"). Regras de consumo em docs/api-publica.md:
// consumir, nunca copiar nem alterar; a autorização das funções *External é de quem chama.

export const TESTS_API_VERSION = "1.0.0";

export { testsBreadcrumbSegments } from "./breadcrumbs";

// --- Módulos (catálogo e ativação) ---
export { listActiveModulesHandler as listActiveTestModules, listAllModulesHandler as listAllTestModules } from "./features/list-modules/handler";
export { setModuleEnabledHandler as setTestModuleEnabled } from "./features/set-module-enabled/handler";

// --- Aplicações (instâncias com link) ---
export { createInstanceHandler as createTestInstance } from "./features/create-instance/handler";
// Sem gate de sessão — para outro plugin criar uma aplicação em nome de um fluxo sem login (ex:
// candidatura em vagas), com redirectUrl próprio. Idempotente por externalRef.
export { createInstance as createTestInstanceExternal } from "./features/create-instance/service";
export { getInstanceBySlugHandler as getTestInstanceBySlug } from "./features/get-instance-by-slug/handler";
export { listTeamInstancesHandler as listTeamTestInstances } from "./features/list-team-instances/handler";
export { setInstanceClosedHandler as setTestInstanceClosed } from "./features/set-instance-closed/handler";

// --- Respostas e resultados ---
export { submitAttemptHandler as submitTestAttempt } from "./features/submit-attempt/handler";
export { getResultHandler as getTestResult } from "./features/get-result/handler";
// BYPASS de acesso — só para plugin consumidor que já checou a própria permissão (ver service).
export { getResultExternal as getTestResultExternal } from "./features/get-result/service";
export { claimResultHandler as claimTestResult } from "./features/claim-result/handler";
export { listMyResultsHandler as listMyTestResults } from "./features/list-my-results/handler";
export { listInstanceResultsHandler as listTestInstanceResults } from "./features/list-instance-results/handler";
// BYPASS de ownership — só para plugin consumidor que criou a aplicação (ver service).
export { listInstanceResultsExternal as listTestInstanceResultsExternal } from "./features/list-instance-results/service";
export { reopenResultHandler as reopenTestResult } from "./features/reopen-result/handler";
export { compareInstancesHandler as compareTestInstances } from "./features/compare-instances/handler";
export { exportInstanceResultsHandler as exportTestInstanceResults } from "./features/export-instance-results/handler";

// --- Conteúdo editável (módulos authored) — administradores: permissão tests.content.manage ---
export {
  createQuestionSetHandler as createTestQuestionSet,
  createStarterQuestionSetHandler as createStarterTestQuestionSet,
  deleteQuestionSetHandler as deleteTestQuestionSet,
  duplicateQuestionSetHandler as duplicateTestQuestionSet,
  getQuestionSetHandler as getTestQuestionSet,
  listQuestionSetsHandler as listTestQuestionSets,
  publishQuestionSetHandler as publishTestQuestionSet,
  saveDraftHandler as saveTestQuestionSetDraft,
  setDefaultQuestionSetHandler as setDefaultTestQuestionSet,
} from "./features/manage-question-sets/handler";
export { listPublishedSetsHandler as listPublishedTestQuestionSets } from "./features/list-published-sets/handler";

// --- Execução do teste (perguntas sem gabarito, tentativa com tempo limite) e agregado ---
export { getRunContentHandler as getTestRunContent } from "./features/get-run-content/handler";
export { startAttemptHandler as startTestAttempt } from "./features/start-attempt/handler";
export { getInstanceAggregateHandler as getTestInstanceAggregate } from "./features/get-instance-aggregate/handler";
// BYPASS de acesso — só para plugin consumidor que já checou a própria permissão (ver service).
export { getInstanceAggregateExternal as getTestInstanceAggregateExternal } from "./features/get-instance-aggregate/service";

// --- Equipes ---
export { createTeamHandler as createTestTeam } from "./features/create-team/handler";
export { getTeamHandler as getTestTeam } from "./features/get-team/handler";
export { listMyTeamsHandler as listMyTestTeams } from "./features/list-my-teams/handler";

// --- Compatibilidade com o antigo @venore/plugin-disc (vagas) — ver compat/disc.ts ---
export { getReportFooterText as getTestReportFooterText } from "./platform/report/settings";
export { createDiscInstanceExternal, listInstanceReportsExternal, getDiscReport } from "./compat/disc";

// --- Tipos ---
export type * from "./platform/content/types";
export type {
  CreateQuestionSetResult,
  DeleteResult as DeleteQuestionSetResult,
  GetQuestionSetResult,
  ListQuestionSetsResult,
  PublishResult as PublishQuestionSetResult,
  QuestionSetDetail,
  QuestionSetSummary,
  SaveDraftResult,
} from "./features/manage-question-sets/types";
export type { GetRunContentResult } from "./features/get-run-content/types";
export type { AttemptClock, StartAttemptInput, StartAttemptResult } from "./features/start-attempt/types";
export type { GetInstanceAggregateResult, InstanceAggregateView } from "./features/get-instance-aggregate/types";
export type { QuestionAggregate } from "./platform/content/aggregate";
export type { PublishedSetOption } from "./features/list-published-sets/handler";
export type {
  IdentityMode,
  TestInstanceRecord,
  TestResultIdentity,
  TestResultRecord,
  TestResultView,
  TestTeamMemberRecord,
  TestTeamMemberRole,
  TestTeamRecord,
} from "./contracts/types";
export type { ModuleSummary, ListModulesResult } from "./features/list-modules/types";
export type { SetModuleEnabledInput, SetModuleEnabledResult } from "./features/set-module-enabled/types";
export type { CreateInstanceCommand, CreateInstanceInput, CreateInstanceResult } from "./features/create-instance/types";
export type { InstanceInviteView, GetInstanceBySlugResult } from "./features/get-instance-by-slug/types";
export type { TeamInstanceSummary, ListTeamInstancesResult } from "./features/list-team-instances/types";
export type { SubmitAttemptInput, SubmitAttemptOutcome, SubmitAttemptResult } from "./features/submit-attempt/types";
export type { GetResultResult } from "./features/get-result/types";
export type { ClaimResultInput, ClaimResultResult } from "./features/claim-result/types";
export type { MyResultSummary, ListMyResultsResult } from "./features/list-my-results/types";
export type { InstanceResultSummary, InstanceResultsView, ListInstanceResultsResult } from "./features/list-instance-results/types";
export type { ReopenResultInput, ReopenResultResult } from "./features/reopen-result/types";
export type { SetInstanceClosedInput, SetInstanceClosedResult } from "./features/set-instance-closed/types";
export type { CompareInstancesView, CompareInstancesResult } from "./features/compare-instances/types";
export type { Comparison, ComparisonRow } from "./features/compare-instances/match";
export type { ExportInstanceResultsView, ExportInstanceResultsResult } from "./features/export-instance-results/types";
export type { CreateTeamInput, CreateTeamResult } from "./features/create-team/types";
export type { GetTeamResult, TeamView } from "./features/get-team/types";
export type { ListMyTeamsResult, MyTeamSummary } from "./features/list-my-teams/types";
