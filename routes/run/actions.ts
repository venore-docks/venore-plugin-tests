"use server";

import { isPluginActive } from "@venore/plugin-sdk";
import { grantResultAccess, markInstanceAnswered, readAnsweredInstanceIds } from "../../platform/access-cookie";
import { startTestAttempt, submitTestAttempt } from "../../index";
import type { StartAttemptInput, StartAttemptResult, SubmitAttemptInput, SubmitAttemptResult } from "../../index";

// Envio do teste. Os cookies (acesso temporário ao resultado; "já respondi esta pesquisa anônima")
// são gravados aqui porque só uma ação de servidor pode setar cookie. O cookie de "já respondeu" é
// LIDO aqui no servidor e repassado ao service — nunca vem do cliente.
export async function submitAttemptAction(input: SubmitAttemptInput): Promise<SubmitAttemptResult> {
  if (!(await isPluginActive("tests"))) {
    return { success: false, error: { code: "plugin_disabled", message: "Os testes estão desabilitados." } };
  }

  const result = await submitTestAttempt({ ...input, deviceAnsweredInstanceIds: await readAnsweredInstanceIds() } as SubmitAttemptInput);
  if (result.success) {
    if (result.data.grantViewAccess) await grantResultAccess(result.data.id);
    if (result.data.deviceAnswered && input.instanceId) await markInstanceAnswered(input.instanceId);
  }
  return result;
}

// Abre (ou retoma) a tentativa de um teste com tempo limite — o cronômetro é do servidor.
export async function startAttemptAction(input: StartAttemptInput): Promise<StartAttemptResult> {
  if (!(await isPluginActive("tests"))) {
    return { success: false, error: { code: "plugin_disabled", message: "Os testes estão desabilitados." } };
  }
  return startTestAttempt(input);
}
