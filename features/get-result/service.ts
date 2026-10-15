import { listUsers } from "@venore/plugin-sdk/auth";
import { isTeamMember } from "../../platform/team-access";
import { findResultWithContext, type ResultWithContext } from "./store";
import type { TestResultIdentity, TestResultView } from "../../contracts/types";
import type { GetResultQuery, GetResultResult } from "./types";

async function buildIdentity(context: ResultWithContext): Promise<TestResultIdentity> {
  const { result } = context;
  let name = result.participantName;
  let email = result.participantEmail;

  // Resposta com login: nome/e-mail vêm da conta. listUsers é o único acesso de leitura a usuários
  // por id que o SDK expõe; filtramos o único registro necessário e descartamos o resto.
  if ((!name || !email) && result.userId) {
    const users = await listUsers();
    const owner = users.success ? users.data.find((user) => user.id === result.userId) : undefined;
    name = name ?? owner?.name ?? null;
    email = email ?? owner?.email ?? null;
  }

  return { name, email, teamName: context.teamName, instanceTitle: context.instanceTitle };
}

async function toView(context: ResultWithContext): Promise<TestResultView> {
  const { result } = context;
  return {
    id: result.id,
    testId: result.testId,
    moduleVersion: result.testVersion,
    contextLabel: result.contextLabel,
    dataset: result.dataset,
    headline: result.headline,
    headlineSecondary: result.headlineSecondary,
    createdAt: result.createdAt,
    isClaimed: result.userId !== null,
    identity: await buildIdentity(context),
    questionSetId: result.questionSetId,
    questionSetVersion: result.questionSetVersion,
  };
}

// Regras de acesso a um resultado (quem vê):
//  - o DONO (conta que respondeu ou reivindicou);
//  - membros da equipe da aplicação (o líder acompanha);
//  - o navegador de quem respondeu SEM login uma aplicação que mostra o resultado (cookie temporário);
//  - resposta avulsa sem dono: só depois do login (que a reivindica).
// Mais ninguém: o link sozinho não dá acesso. Plugin consumidor (vagas) usa getResultExternal.
export async function getResult(query: GetResultQuery): Promise<GetResultResult> {
  const context = await findResultWithContext(query.resultId);
  if (!context) {
    return { success: false, error: { code: "not_found", message: "Resultado não encontrado." } };
  }
  const { result } = context;

  const isOwner = query.viewerId !== null && result.userId === query.viewerId;
  const hasCapability = result.instanceId !== null && query.capabilityResultIds.includes(result.id);
  const isTeamViewer = query.viewerId !== null && context.teamId ? await isTeamMember(context.teamId, query.viewerId) : false;

  if (isOwner || hasCapability || isTeamViewer) {
    return { success: true, data: await toView(context) };
  }

  if (result.userId === null && result.instanceId === null) {
    return query.viewerId
      ? { success: false, error: { code: "not_claimed", message: "Este resultado ainda não está vinculado a uma conta." } }
      : { success: false, error: { code: "login_required", message: "Entre para ver o seu resultado." } };
  }

  return query.viewerId
    ? { success: false, error: { code: "forbidden", message: "Você não tem acesso a este resultado." } }
    : { success: false, error: { code: "login_required", message: "Entre para ver este resultado." } };
}

// BYPASS de acesso — só para plugin consumidor (ex: vagas) que já validou a própria permissão de
// negócio (ex: vagas.applications.review) antes de chamar. Nunca expor a uma rota/ação sem checar.
export async function getResultExternal(resultId: string): Promise<GetResultResult> {
  const context = await findResultWithContext(resultId);
  if (!context) {
    return { success: false, error: { code: "not_found", message: "Resultado não encontrado." } };
  }
  return { success: true, data: await toView(context) };
}
