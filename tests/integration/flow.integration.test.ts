// Verificação do plugin contra um Postgres de verdade (PGlite, em memória): aplica a migration real e
// exercita os serviços — bloqueio por e-mail, acesso a resultado, reabrir, encerrar link, vagas
// (compat), comparação, exportação e ativação de módulos. NÃO roda no CI padrão (o vitest.plugins do
// core exclui *.integration.test.*); rode com scripts/run-integration.ps1.
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, db, state } from "./mocks";
import { discFixtures } from "../../modules/disc/fixtures";
import { createTeam } from "../../features/create-team/service";
import { createInstance } from "../../features/create-instance/service";
import { submitAttempt } from "../../features/submit-attempt/service";
import { getResult, getResultExternal } from "../../features/get-result/service";
import { claimResult } from "../../features/claim-result/service";
import { reopenResult } from "../../features/reopen-result/service";
import { compareInstances } from "../../features/compare-instances/service";
import { listInstanceResults, listInstanceResultsExternal } from "../../features/list-instance-results/service";
import { setInstanceClosed } from "../../features/set-instance-closed/service";
import { exportInstanceResults } from "../../features/export-instance-results/service";
import { listTeamInstances } from "../../features/list-team-instances/service";
import { setModuleEnabled } from "../../platform/modules/activation";
import { createDiscInstanceExternal, getDiscReport, listInstanceReportsExternal } from "../../compat/disc";
import { testTeamMembers } from "../../database/schema";

const ANSWERS_A = discFixtures.valid[0].answers;
const ANSWERS_B = discFixtures.valid[1].answers;

const owner = { id: "owner-1", name: "Dona da Equipe", email: "dona@x.com" };
const member = { id: "member-1", name: "Membro", email: "membro@x.com" };
const stranger = { id: "stranger-1", name: "Estranho", email: "estranho@x.com" };

describe("plugin Testes — fluxo contra Postgres de verdade (PGlite)", () => {
  let teamId = "";
  let instanceId = "";

  beforeAll(async () => {
    await applyMigrations(fileURLToPath(new URL("../../migrations", import.meta.url)));
    state.users = [owner, member, stranger];
  });

  it("equipe: dono vira admin; membro comum não cria aplicação", async () => {
    const team = await createTeam({ name: "Comercial", actorId: owner.id });
    if (!team.success) throw new Error("falhou criar equipe");
    teamId = team.data.id;
    await db.insert(testTeamMembers).values({ teamId, userId: member.id, role: "member" });

    const denied = await createInstance({ testId: "disc", teamId, contextLabel: "No trabalho", actorId: member.id });
    expect(denied).toMatchObject({ success: false, error: { code: "forbidden" } });

    const created = await createInstance({ testId: "disc", teamId, title: "1º trimestre", contextLabel: "  No   time comercial ", actorId: owner.id });
    if (!created.success) throw new Error("falhou criar instância: " + JSON.stringify(created.error));
    instanceId = created.data.id;
    expect(created.data).toMatchObject({ contextLabel: "No time comercial", identityMode: "identified", showResultToParticipant: true });
  });

  it("sem login: nome + e-mail, uma resposta por e-mail por aplicação", async () => {
    state.current = null;
    const first = await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId, participant: { name: "Maria Silva", email: "Maria@Empresa.com" }, actorId: null });
    expect(first).toMatchObject({ success: true, data: { grantViewAccess: true } });
    if (first.success) expect(first.data.redirectTo).toBe(`/testes/r/${first.data.id}`);

    const duplicate = await submitAttempt({ moduleId: "disc", answers: ANSWERS_B, instanceId, participant: { name: "Maria S.", email: " maria@empresa.COM " }, actorId: null });
    expect(duplicate).toMatchObject({ success: false, error: { code: "already_answered" } });

    const other = await submitAttempt({ moduleId: "disc", answers: ANSWERS_B, instanceId, participant: { name: "João", email: "joao@empresa.com" }, actorId: null });
    expect(other.success).toBe(true);

    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId, participant: { name: "", email: "x@y.com" }, actorId: null })).toMatchObject({ error: { code: "invalid_name" } });
    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId, participant: { name: "Zé", email: "ze" }, actorId: null })).toMatchObject({ error: { code: "invalid_email" } });
    expect(await submitAttempt({ moduleId: "disc", answers: { more: {}, less: {} }, instanceId, participant: { name: "Zé", email: "ze@x.com" }, actorId: null })).toMatchObject({ error: { code: "incomplete_answers" } });
  });

  it("acesso ao resultado: cookie temporário, dono, equipe — e o link sozinho não abre", async () => {
    const listed = await listInstanceResultsExternal(instanceId);
    if (!listed.success) throw new Error("listagem externa falhou");
    expect(listed.data.results).toHaveLength(2);
    const maria = listed.data.results.find((row) => row.participantName === "Maria Silva")!;
    expect(maria.label).toMatch(/\(Di\)|\(Di/i);

    // só o link
    expect(await getResult({ resultId: maria.id, viewerId: null, capabilityResultIds: [] })).toMatchObject({ error: { code: "login_required" } });
    // quem não é da equipe, logado
    expect(await getResult({ resultId: maria.id, viewerId: stranger.id, capabilityResultIds: [] })).toMatchObject({ error: { code: "forbidden" } });
    // cookie do navegador de quem respondeu
    const withCookie = await getResult({ resultId: maria.id, viewerId: null, capabilityResultIds: [maria.id] });
    expect(withCookie).toMatchObject({ success: true, data: { identity: { name: "Maria Silva", email: "Maria@Empresa.com", teamName: "Comercial", instanceTitle: "1º trimestre" } } });
    // membro da equipe
    expect(await getResult({ resultId: maria.id, viewerId: member.id, capabilityResultIds: [] })).toMatchObject({ success: true });
    // consumidor (bypass)
    expect(await getResultExternal(maria.id)).toMatchObject({ success: true });
  });

  it("líder: listagem por equipe, reabrir (só admin) e a pessoa responde de novo", async () => {
    expect(await listInstanceResults({ instanceId, actorId: stranger.id })).toMatchObject({ error: { code: "forbidden" } });
    const asMember = await listInstanceResults({ instanceId, actorId: member.id });
    expect(asMember).toMatchObject({ success: true, data: { canManage: false } });
    const asOwner = await listInstanceResults({ instanceId, actorId: owner.id });
    if (!asOwner.success) throw new Error("falhou");
    expect(asOwner.data.canManage).toBe(true);

    const maria = asOwner.data.results.find((row) => row.participantName === "Maria Silva")!;
    expect(await reopenResult({ resultId: maria.id, actorId: member.id })).toMatchObject({ error: { code: "forbidden" } });
    expect(await reopenResult({ resultId: maria.id, actorId: owner.id })).toMatchObject({ success: true });

    const again = await submitAttempt({ moduleId: "disc", answers: ANSWERS_B, instanceId, participant: { name: "Maria Silva", email: "maria@empresa.com" }, actorId: null });
    expect(again.success).toBe(true);
  });

  it("encerrar o link bloqueia respostas novas, mas mantém as antigas; reabrir o link volta", async () => {
    expect(await setInstanceClosed({ instanceId, closed: true, actorId: member.id })).toMatchObject({ error: { code: "forbidden" } });
    expect(await setInstanceClosed({ instanceId, closed: true, actorId: owner.id })).toMatchObject({ success: true });
    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId, participant: { name: "Novo", email: "novo@x.com" }, actorId: null })).toMatchObject({ error: { code: "instance_closed" } });
    const listed = await listTeamInstances({ teamId, actorId: member.id });
    expect(listed).toMatchObject({ success: true, data: [{ closed: true, responseCount: 2 }] });
    await setInstanceClosed({ instanceId, closed: false, actorId: owner.id });
    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId, participant: { name: "Novo", email: "novo@x.com" }, actorId: null })).toMatchObject({ success: true });
  });

  it("avulso: resposta sem dono expira, só aparece depois do login e só um login a reivindica", async () => {
    state.current = null;
    const solo = await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, contextLabel: "Em casa", actorId: null });
    if (!solo.success) throw new Error("falhou avulso: " + JSON.stringify(solo.error));
    expect(solo.data).toMatchObject({ grantViewAccess: false });
    expect(await getResult({ resultId: solo.data.id, viewerId: null, capabilityResultIds: [] })).toMatchObject({ error: { code: "login_required" } });
    expect(await getResult({ resultId: solo.data.id, viewerId: stranger.id, capabilityResultIds: [] })).toMatchObject({ error: { code: "not_claimed" } });

    expect(await claimResult({ resultId: solo.data.id, actorId: stranger.id })).toMatchObject({ success: true });
    expect(await getResult({ resultId: solo.data.id, viewerId: stranger.id, capabilityResultIds: [] })).toMatchObject({ success: true });
    expect(await claimResult({ resultId: solo.data.id, actorId: member.id })).toMatchObject({ error: { code: "already_claimed" } });
    expect(await getResult({ resultId: solo.data.id, viewerId: member.id, capabilityResultIds: [] })).toMatchObject({ error: { code: "forbidden" } });

    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, contextLabel: "x", actorId: null })).toMatchObject({ error: { code: "invalid_context" } });
  });

  it("resposta de aplicação nunca é reivindicada por quem abre o link", async () => {
    const listed = await listInstanceResultsExternal(instanceId);
    if (!listed.success) throw new Error("falhou");
    expect(await claimResult({ resultId: listed.data.results[0].id, actorId: stranger.id })).toMatchObject({ error: { code: "not_claimable" } });
  });

  it("modo login exige conta; com conta, uma resposta por conta", async () => {
    const inst = await createInstance({ testId: "disc", teamId, contextLabel: "No trabalho", identityMode: "login", actorId: owner.id });
    if (!inst.success) throw new Error("falhou");
    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId: inst.data.id, actorId: null })).toMatchObject({ error: { code: "unauthenticated" } });
    const ok = await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId: inst.data.id, actorId: member.id, actorName: member.name, actorEmail: member.email });
    expect(ok).toMatchObject({ success: true, data: { grantViewAccess: false } });
    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_B, instanceId: inst.data.id, actorId: member.id })).toMatchObject({ error: { code: "already_answered" } });
  });

  it("vagas (compat): instância idempotente por candidatura, sem mostrar resultado ao candidato, RH lê", async () => {
    const first = await createDiscInstanceExternal({ environmentLabel: "Vaga: Analista", actorId: null, redirectUrl: "/vagas/obrigado", externalRef: "vagas:cand-1" });
    const second = await createDiscInstanceExternal({ environmentLabel: "Vaga: Analista", actorId: null, redirectUrl: "/vagas/obrigado", externalRef: "vagas:cand-1" });
    if (!first.success || !second.success) throw new Error("falhou");
    expect(second.data.id).toBe(first.data.id);

    expect(await createDiscInstanceExternal({ environmentLabel: "Vaga: Outra", actorId: null, redirectUrl: "https://evil.example/x", externalRef: "vagas:cand-2" })).toMatchObject({ error: { code: "invalid_redirect" } });

    const sent = await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId: first.data.id, participant: { name: "Candidato", email: "cand@x.com" }, actorId: null });
    if (!sent.success) throw new Error("falhou envio candidato");
    expect(sent.data.redirectTo).toBe(`/vagas/obrigado?reportId=${sent.data.id}&resultId=${sent.data.id}`);
    expect(sent.data.grantViewAccess).toBe(false);

    const reports = await listInstanceReportsExternal(first.data.id);
    expect(reports).toMatchObject({ success: true, data: [{ id: sent.data.id }] });
    const report = await getDiscReport({ reportId: sent.data.id });
    expect(report).toMatchObject({ success: true, data: { environmentLabel: "Vaga: Analista" } });
    if (report.success) expect(report.data.dataset.more.profile).toBeTruthy();
  });

  it("comparar duas aplicações da mesma equipe casa pelo e-mail", async () => {
    const second = await createInstance({ testId: "disc", teamId, title: "2º trimestre", contextLabel: "No time comercial", actorId: owner.id });
    if (!second.success) throw new Error("falhou");
    await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId: second.data.id, participant: { name: "Maria Silva", email: "maria@empresa.com" }, actorId: null });
    await submitAttempt({ moduleId: "disc", answers: ANSWERS_B, instanceId: second.data.id, participant: { name: "Pedro", email: "pedro@empresa.com" }, actorId: null });

    const result = await compareInstances({ teamId, instanceAId: instanceId, instanceBId: second.data.id, actorId: member.id });
    if (!result.success) throw new Error("falhou comparar: " + JSON.stringify(result.error));
    expect(result.data.sameContext).toBe(true);
    expect(result.data.comparison.matched).toBeGreaterThanOrEqual(1);
    expect(result.data.comparison.rows.find((row) => row.who === "Maria Silva")).toMatchObject({ a: expect.any(String), b: expect.any(String) });
    expect(result.data.comparison.rows.find((row) => row.who === "Pedro")).toMatchObject({ a: null });

    expect(await compareInstances({ teamId, instanceAId: instanceId, instanceBId: second.data.id, actorId: stranger.id })).toMatchObject({ error: { code: "forbidden" } });
    expect(await compareInstances({ teamId, instanceAId: instanceId, instanceBId: instanceId, actorId: member.id })).toMatchObject({ error: { code: "same_instance" } });
  });

  it("exportar planilha: só membro; sem fórmulas injetadas", async () => {
    const evil = await createInstance({ testId: "disc", teamId, contextLabel: "No trabalho", actorId: owner.id });
    if (!evil.success) throw new Error("falhou");
    await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, instanceId: evil.data.id, participant: { name: "=HYPERLINK(\"http://x\")", email: "evil@x.com" }, actorId: null });
    expect(await exportInstanceResults({ instanceId: evil.data.id, actorId: stranger.id })).toMatchObject({ error: { code: "forbidden" } });
    const exported = await exportInstanceResults({ instanceId: evil.data.id, actorId: member.id });
    if (!exported.success) throw new Error("falhou exportar");
    expect(exported.data.csv.startsWith("\uFEFF")).toBe(true);
    expect(exported.data.csv).toContain("\"'=HYPERLINK");
    expect(exported.data.csv).not.toMatch(/(^|,)=HYPERLINK/m);
  });

  it("desligar o módulo bloqueia aplicação e resposta novas, mas o resultado antigo continua legível", async () => {
    const listed = await listInstanceResultsExternal(instanceId);
    if (!listed.success) throw new Error("falhou");
    const anyResult = listed.data.results[0].id;

    await setModuleEnabled("disc", false, owner.id);
    expect(await createInstance({ testId: "disc", teamId, contextLabel: "No trabalho", actorId: owner.id })).toMatchObject({ error: { code: "module_disabled" } });
    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, contextLabel: "Em casa", actorId: null })).toMatchObject({ error: { code: "module_disabled" } });
    expect(await getResultExternal(anyResult)).toMatchObject({ success: true });

    await setModuleEnabled("disc", true, owner.id);
    expect(await submitAttempt({ moduleId: "disc", answers: ANSWERS_A, contextLabel: "Em casa", actorId: null })).toMatchObject({ success: true });
  });
});
