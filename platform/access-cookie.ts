import { cookies } from "next/headers";

// DOIS cookies, ambos httpOnly:
//
// 1) tests_result_access — acesso TEMPORÁRIO a um resultado para quem respondeu SEM login (link de
//    equipe): o navegador que enviou a resposta guarda o id do resultado por algumas horas — é só o
//    que permite ver o relatório logo depois de responder, sem conta. Passado o prazo, só o dono
//    (login), o líder da equipe ou o RH (vagas) enxergam. O link do relatório sozinho nunca dá acesso.
//
// 2) tests_answered — pesquisas ANÔNIMAS já respondidas NESTE navegador (ids de aplicação, 1 ano).
//    Pesquisa anônima não guarda quem respondeu, então não dá para barrar "a mesma pessoa" — só
//    lembrar, aqui, que alguém já enviou deste navegador. Barreira contra clique repetido, não
//    contra fraude (limpar cookies ou trocar de navegador contorna — e a tela avisa isso).
const RESULT_COOKIE = "tests_result_access";
const RESULT_MAX_AGE_SECONDS = 6 * 60 * 60;
const ANSWERED_COOKIE = "tests_answered";
const ANSWERED_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const MAX_IDS = 10;
const MAX_ANSWERED = 30;
const ID_PATTERN = /^[0-9a-f-]{36}$/i;

async function readIds(name: string): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(name)?.value ?? "";
  return raw.split(",").filter((id) => ID_PATTERN.test(id));
}

async function writeIds(name: string, ids: string[], maxAge: number): Promise<void> {
  const store = await cookies();
  store.set(name, ids.join(","), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
}

export async function readAccessibleResultIds(): Promise<string[]> {
  return readIds(RESULT_COOKIE);
}

export async function grantResultAccess(resultId: string): Promise<void> {
  const current = await readIds(RESULT_COOKIE);
  await writeIds(RESULT_COOKIE, [resultId, ...current.filter((id) => id !== resultId)].slice(0, MAX_IDS), RESULT_MAX_AGE_SECONDS);
}

export async function readAnsweredInstanceIds(): Promise<string[]> {
  return readIds(ANSWERED_COOKIE);
}

export async function markInstanceAnswered(instanceId: string): Promise<void> {
  const current = await readIds(ANSWERED_COOKIE);
  await writeIds(ANSWERED_COOKIE, [instanceId, ...current.filter((id) => id !== instanceId)].slice(0, MAX_ANSWERED), ANSWERED_MAX_AGE_SECONDS);
}
