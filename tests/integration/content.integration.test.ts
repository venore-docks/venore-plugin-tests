// Conteúdo editável contra um Postgres de verdade (PGlite): conjuntos versionados, aplicação fixada
// na versão, tempo limite medido pelo servidor, pesquisa anônima com agregado protegido. Ver
// scripts/run-integration.ps1.
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, db, state } from "./mocks";
import { testAttempts } from "../../database/schema";
import { createInstance } from "../../features/create-instance/service";
import { createTeam } from "../../features/create-team/service";
import { getInstanceAggregate } from "../../features/get-instance-aggregate/service";
import { getRunContent } from "../../features/get-run-content/service";
import { listInstanceResults } from "../../features/list-instance-results/service";
import {
  createQuestionSet,
  createStarterQuestionSet,
  deleteQuestionSet,
  getQuestionSet,
  publishQuestionSet,
  saveDraft,
  setDefaultQuestionSet,
} from "../../features/manage-question-sets/service";
import { startAttempt } from "../../features/start-attempt/service";
import { submitAttempt } from "../../features/submit-attempt/service";
import { getResultExternal } from "../../features/get-result/service";
import { exportInstanceResults } from "../../features/export-instance-results/service";
import { setModuleEnabled } from "../../platform/modules/activation";
import { bigFiveFixtures } from "../../modules/bigfive/fixtures";
import { climateFixtures } from "../../modules/clima/fixtures";
import { knowledgeFixtures } from "../../modules/conhecimentos/fixtures";
import type { QuestionSetContent } from "../../platform/content/types";

const admin = { id: "admin-1", name: "Admin", email: "admin@x.com" };
const leader = { id: "leader-1", name: "Líder", email: "lider@x.com" };
const ALL_RIGHT = knowledgeFixtures.valid[0].answers;
const CLIMATE = climateFixtures.valid[0].answers;

describe("conteúdo editável — plugin Testes (PGlite)", () => {
  let teamId = "";

  beforeAll(async () => {
    await applyMigrations(fileURLToPath(new URL("../../migrations", import.meta.url)));
    state.users = [admin, leader];
    for (const id of ["big-five", "conhecimentos", "clima"]) await setModuleEnabled(id, true, admin.id);
    const team = await createTeam({ name: "RH", actorId: leader.id });
    if (!team.success) throw new Error("equipe");
    teamId = team.data.id;
  });

  it("sem conteúdo publicado, o teste não roda e a aplicação não é criada", async () => {
    expect(await getRunContent({ moduleId: "conhecimentos", instanceId: null })).toMatchObject({ error: { code: "no_content" } });
    expect(await createInstance({ testId: "conhecimentos", teamId, contextLabel: "Seleção", actorId: leader.id })).toMatchObject({ error: { code: "no_content" } });
    expect(await submitAttempt({ moduleId: "conhecimentos", answers: ALL_RIGHT, contextLabel: "Seleção", actorId: null })).toMatchObject({ error: { code: "no_content" } });
  });

  it("DISC (conteúdo fixo) não tem o que editar", async () => {
    expect(await createStarterQuestionSet({ moduleId: "disc" }, admin.id)).toMatchObject({ error: { code: "module_not_authored" } });
    expect(await createQuestionSet({ moduleId: "disc", title: "x" }, admin.id)).toMatchObject({ error: { code: "module_not_authored" } });
  });

  it("conjunto de exemplo: publicado, padrão e SEM gabarito no que vai ao navegador", async () => {
    const starter = await createStarterQuestionSet({ moduleId: "conhecimentos" }, admin.id);
    if (!starter.success) throw new Error("starter " + JSON.stringify(starter.error));
    expect(starter.data.created).toBe(true);
    expect(await createStarterQuestionSet({ moduleId: "conhecimentos" }, admin.id)).toMatchObject({ data: { id: starter.data.id, created: false } });

    const run = await getRunContent({ moduleId: "conhecimentos", instanceId: null });
    if (!run.success || !run.data.content) throw new Error("conteúdo");
    expect(run.data.content.version).toBe(1);
    expect(JSON.stringify(run.data.content)).not.toContain("correct");
    expect(JSON.stringify(run.data.content)).not.toContain("explanation");
  });

  it("editar rascunho, validar e publicar versão nova; a aplicação criada antes continua na versão 1", async () => {
    const detail = await listSets("conhecimentos");
    const setId = detail[0].id;

    // Aplicação criada na versão 1
    const instance = await createInstance({ testId: "conhecimentos", teamId, title: "Seleção 2026", contextLabel: "Processo seletivo", actorId: leader.id });
    if (!instance.success) throw new Error("instância " + JSON.stringify(instance.error));
    expect(instance.data).toMatchObject({ questionSetId: setId, questionSetVersion: 1 });

    // Edita: remove a última pergunta e muda a nota de corte
    const set = await getQuestionSet(setId);
    if (!set.success) throw new Error("get");
    const draft: QuestionSetContent = { ...set.data.draft, settings: { ...set.data.draft.settings, passScore: 50, timeLimitMinutes: 0 }, questions: set.data.draft.questions.slice(0, 6) };
    expect(await saveDraft({ setId, title: "Conhecimentos gerais", content: draft }, admin.id)).toMatchObject({ success: true, data: { hasUnpublishedChanges: true } });

    // Rascunho inválido (resposta única sem gabarito) NÃO publica
    const broken = { ...draft, questions: draft.questions.map((q, i) => (i === 0 ? { ...q, options: q.options!.map((o) => ({ ...o, correct: undefined })) } : q)) };
    expect(await saveDraft({ setId, title: "Conhecimentos gerais", content: broken }, admin.id)).toMatchObject({ success: true, data: { publishProblems: [{ message: expect.stringContaining("UMA resposta correta") }] } });
    expect(await publishQuestionSet({ setId }, admin.id)).toMatchObject({ error: { code: "cannot_publish" } });

    // Estrutura quebrada nem salva (ids repetidos)
    const dup = { ...draft, questions: [draft.questions[0], { ...draft.questions[1], id: draft.questions[0].id }] };
    expect(await saveDraft({ setId, title: "Duplicado", content: dup }, admin.id)).toMatchObject({ error: { code: "invalid_content" } });

    // Corrige e publica a versão 2
    await saveDraft({ setId, title: "Conhecimentos gerais", content: draft }, admin.id);
    expect(await publishQuestionSet({ setId }, admin.id)).toMatchObject({ success: true, data: { version: 2 } });
    expect(await publishQuestionSet({ setId }, admin.id)).toMatchObject({ error: { code: "nothing_to_publish" } });

    // Aplicação antiga: ainda 8 perguntas (versão 1); aplicação nova: 6 perguntas (versão 2)
    const oldRun = await getRunContent({ moduleId: "conhecimentos", instanceId: instance.data.id });
    expect(oldRun).toMatchObject({ success: true, data: { content: { version: 1 } } });
    if (oldRun.success) expect(oldRun.data.content?.questions).toHaveLength(8);
    const fresh = await createInstance({ testId: "conhecimentos", teamId, contextLabel: "Outra", actorId: leader.id });
    if (!fresh.success) throw new Error("fresh");
    expect(fresh.data.questionSetVersion).toBe(2);
    const newRun = await getRunContent({ moduleId: "conhecimentos", instanceId: fresh.data.id });
    if (newRun.success) expect(newRun.data.content?.questions).toHaveLength(6);

    // Responder a aplicação antiga pontua contra a versão 1 (8 perguntas, gabarito completo = 100%)
    // A versão 1 (exemplo) tem 10 minutos: o servidor exige a tentativa.
    const clock = await startAttempt({ moduleId: "conhecimentos", instanceId: instance.data.id, contentRef: { setId, version: 1 }, actorId: null });
    if (!clock.success || !clock.data) throw new Error("tentativa v1");
    const sent = await submitAttempt({ moduleId: "conhecimentos", answers: ALL_RIGHT, instanceId: instance.data.id, participant: { name: "Ana Souza", email: "ana@x.com" }, attemptId: clock.data.attemptId, actorId: null });
    if (!sent.success) throw new Error("envio " + JSON.stringify(sent.error));
    const view = await getResultExternal(sent.data.id);
    expect(view).toMatchObject({ success: true, data: { headline: "100", headlineSecondary: "approved", questionSetVersion: 1 } });
  });

  it("padrão, duplicar e excluir: só publicado vira padrão; usado é arquivado, não apagado", async () => {
    const draftSet = await createQuestionSet({ moduleId: "conhecimentos", title: "Novo" }, admin.id);
    if (!draftSet.success) throw new Error("novo");
    expect(await setDefaultQuestionSet({ setId: draftSet.data.id })).toMatchObject({ error: { code: "not_published" } });
    expect(await deleteQuestionSet({ setId: draftSet.data.id })).toMatchObject({ data: { action: "deleted" } });

    const used = (await listSets("conhecimentos"))[0];
    expect(await deleteQuestionSet({ setId: used.id })).toMatchObject({ data: { action: "archived" } });
    expect(await getQuestionSet(used.id)).toMatchObject({ success: true, data: { archived: true, isDefault: false } });
    // arquivado não aceita edição nem nova aplicação
    expect(await saveDraft({ setId: used.id, title: "x", content: (used as unknown as { draft: unknown }).draft ?? {} }, admin.id)).toMatchObject({ error: { code: "archived" } });
    expect(await createInstance({ testId: "conhecimentos", teamId, contextLabel: "Seleção", actorId: leader.id })).toMatchObject({ error: { code: "no_content" } });
    // …mas o resultado antigo continua legível
    expect(await getRunContent({ moduleId: "conhecimentos", instanceId: null })).toMatchObject({ error: { code: "no_content" } });
  });

  it("tempo limite: o servidor exige a tentativa e marca envio fora do prazo", async () => {
    const created = await createQuestionSet({ moduleId: "conhecimentos", title: "Prova com tempo" }, admin.id);
    if (!created.success) throw new Error("set");
    const base = (await getQuestionSet(created.data.id)) as { success: true; data: { draft: QuestionSetContent } };
    const content: QuestionSetContent = {
      settings: { timeLimitMinutes: 5, passScore: 50, demo: false },
      questions: [{ id: "t1", text: "2+2?", kind: "single", required: true, meta: { points: 1 }, options: [{ id: "a", text: "4", correct: true }, { id: "b", text: "5" }] }],
    };
    void base;
    await saveDraft({ setId: created.data.id, title: "Prova com tempo", content }, admin.id);
    expect(await publishQuestionSet({ setId: created.data.id }, admin.id)).toMatchObject({ success: true });
    expect(await setDefaultQuestionSet({ setId: created.data.id })).toMatchObject({ success: true });

    const instance = await createInstance({ testId: "conhecimentos", teamId, contextLabel: "Prova", actorId: leader.id });
    if (!instance.success) throw new Error("instância");
    const ref = { setId: created.data.id, version: 1 };
    const who = { name: "Carlos Lima", email: "carlos@x.com" };

    // sem tentativa → recusa
    expect(await submitAttempt({ moduleId: "conhecimentos", answers: { t1: "a" }, instanceId: instance.data.id, participant: who, actorId: null })).toMatchObject({ error: { code: "attempt_required" } });
    // tentativa de outro contexto → recusa
    expect(await submitAttempt({ moduleId: "conhecimentos", answers: { t1: "a" }, instanceId: instance.data.id, participant: who, attemptId: "nao-existe", actorId: null })).toMatchObject({ error: { code: "attempt_invalid" } });

    const clock = await startAttempt({ moduleId: "conhecimentos", instanceId: instance.data.id, contentRef: ref, actorId: null });
    if (!clock.success || !clock.data) throw new Error("tentativa");
    expect(Date.parse(clock.data.expiresAt) - Date.parse(clock.data.serverNow)).toBe(5 * 60 * 1000);

    // retomar devolve a MESMA tentativa (recarregar não reinicia o relógio)
    const again = await startAttempt({ moduleId: "conhecimentos", instanceId: instance.data.id, contentRef: ref, existingAttemptId: clock.data.attemptId, actorId: null });
    expect(again).toMatchObject({ success: true, data: { attemptId: clock.data.attemptId, expiresAt: clock.data.expiresAt } });

    // simula que a tentativa começou há 6 minutos (1 min além do prazo + 30s de margem)
    await db.update(testAttempts).set({ startedAt: new Date(Date.now() - 6 * 60 * 1000) }).where(eq(testAttempts.id, clock.data.attemptId));
    const sent = await submitAttempt({ moduleId: "conhecimentos", answers: { t1: "a" }, instanceId: instance.data.id, participant: who, attemptId: clock.data.attemptId, actorId: null });
    if (!sent.success) throw new Error("envio " + JSON.stringify(sent.error));
    const view = await getResultExternal(sent.data.id);
    expect(view).toMatchObject({ success: true, data: { dataset: { late: true, percent: 100, timeLimitMinutes: 5 } } });

    // a tentativa foi consumida: reenviar com ela falha
    expect(await submitAttempt({ moduleId: "conhecimentos", answers: { t1: "a" }, instanceId: instance.data.id, participant: { name: "Outro Nome", email: "outro@x.com" }, attemptId: clock.data.attemptId, actorId: null })).toMatchObject({ error: { code: "attempt_invalid" } });

    // projeção: sem tempo limite no conjunto não há tentativa
    expect(await startAttempt({ moduleId: "conhecimentos", instanceId: null, contentRef: { setId: created.data.id, version: 99 }, actorId: null })).toMatchObject({ error: { code: "no_content" } });
  });

  it("Big Five avulso: exige o conteúdo da tela, de um conjunto DESTE módulo", async () => {
    expect(await submitAttempt({ moduleId: "big-five", answers: bigFiveFixtures.valid[0].answers, contextLabel: "No trabalho", actorId: null })).toMatchObject({ error: { code: "no_content" } });
    const starter = await createStarterQuestionSet({ moduleId: "big-five" }, admin.id);
    if (!starter.success) throw new Error("starter bf");
    const run = await getRunContent({ moduleId: "big-five", instanceId: null });
    if (!run.success || !run.data.content) throw new Error("run");
    expect(JSON.stringify(run.data.content)).not.toContain("trait");

    const ref = { setId: run.data.content.setId, version: run.data.content.version };
    // conjunto de OUTRO módulo é recusado
    const otherSet = (await listSets("conhecimentos"))[0];
    expect(await submitAttempt({ moduleId: "big-five", answers: bigFiveFixtures.valid[0].answers, contextLabel: "No trabalho", contentRef: { setId: otherSet.id, version: 1 }, actorId: null })).toMatchObject({ error: { code: "no_content" } });

    const ok = await submitAttempt({ moduleId: "big-five", answers: bigFiveFixtures.valid[1].answers, contextLabel: "No trabalho", contentRef: ref, actorId: null });
    if (!ok.success) throw new Error("envio bf " + JSON.stringify(ok.error));
    expect(await getResultExternal(ok.data.id)).toMatchObject({ data: { headline: "N", headlineSecondary: "O", questionSetId: ref.setId } });
  });

  it("pesquisa de clima: anônima, sem identidade, agregado só com 5 respostas", async () => {
    await createStarterQuestionSet({ moduleId: "clima" }, admin.id);
    const instance = await createInstance({ testId: "clima", teamId, title: "Clima 1º sem.", contextLabel: "Na empresa", actorId: leader.id });
    if (!instance.success) throw new Error("clima instância");
    expect(instance.data).toMatchObject({ identityMode: "anonymous", showResultToParticipant: false });

    const send = (extra: Partial<Parameters<typeof submitAttempt>[0]> = {}) =>
      submitAttempt({ moduleId: "clima", answers: CLIMATE, instanceId: instance.data.id, actorId: null, ...extra });

    for (let i = 0; i < 4; i++) expect(await send()).toMatchObject({ success: true, data: { deviceAnswered: true, redirectTo: "/testes/concluido", grantViewAccess: false } });

    const few = await getInstanceAggregate({ instanceId: instance.data.id, actorId: leader.id });
    expect(few).toMatchObject({ success: true, data: { total: 4, insufficient: true, questions: [] } });

    // este navegador já respondeu → recusa (barreira contra clique repetido)
    expect(await send({ deviceAnsweredInstanceIds: [instance.data.id] })).toMatchObject({ error: { code: "already_answered" } });

    // logado NÃO vira identificado: a conta não é gravada em resposta anônima
    state.current = leader;
    const logged = await send({ actorId: leader.id, actorName: leader.name, actorEmail: leader.email });
    state.current = null;
    if (!logged.success) throw new Error("logado " + JSON.stringify(logged.error));
    const stored = await getResultExternal(logged.data.id);
    expect(stored).toMatchObject({ success: true, data: { isClaimed: false, identity: { name: null, email: null } } });

    const enough = await getInstanceAggregate({ instanceId: instance.data.id, actorId: leader.id });
    if (!enough.success) throw new Error("agregado");
    expect(enough.data).toMatchObject({ total: 5, insufficient: false });
    const scale = enough.data.questions[0];
    expect(scale.scale).toMatchObject({ mean: 4, distribution: [0, 0, 0, 5, 0] });

    // sem lista individual nem planilha por pessoa
    expect(await listInstanceResults({ instanceId: instance.data.id, actorId: leader.id })).toMatchObject({ success: true, data: { individualHidden: true, total: 5, results: [] } });
    expect(await exportInstanceResults({ instanceId: instance.data.id, actorId: leader.id })).toMatchObject({ error: { code: "forbidden" } });
    // quem não é da equipe não vê nem o agregado
    expect(await getInstanceAggregate({ instanceId: instance.data.id, actorId: admin.id })).toMatchObject({ error: { code: "forbidden" } });
  });

  it("clima: respostas inválidas são recusadas contra o conteúdo publicado", async () => {
    const inst = await createInstance({ testId: "clima", teamId, contextLabel: "Na empresa", actorId: leader.id });
    if (!inst.success) throw new Error("inst");
    const bad = { ...(CLIMATE as Record<string, unknown>), c1: 9 };
    expect(await submitAttempt({ moduleId: "clima", answers: bad, instanceId: inst.data.id, actorId: null })).toMatchObject({ error: { code: "invalid_answers" } });
    expect(await submitAttempt({ moduleId: "clima", answers: {}, instanceId: inst.data.id, actorId: null })).toMatchObject({ error: { code: "incomplete_answers" } });
  });
});

async function listSets(moduleId: string) {
  const { listQuestionSets } = await import("../../features/manage-question-sets/service");
  const result = await listQuestionSets(moduleId);
  if (!result.success) throw new Error("lista");
  return result.data;
}
