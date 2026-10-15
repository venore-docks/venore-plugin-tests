import { DISC_QUESTIONS } from "./engine/questions";
import type { ModuleFixtures } from "../../platform/modules/fixtures";

// Fixtures do módulo DISC para o teste de contrato (platform/modules/contract.test.ts). A paridade
// numérica fina com o NestPro mora em engine/score-disc.test.ts; aqui o que se trava é o caminho
// COMPLETO do módulo: validar respostas → pontuar → resumo (headline) que a plataforma grava.

// Respostas válidas: em cada pergunta, "mais" = opção `moreIndex` e "menos" = opção `lessIndex`
// (índices diferentes, como a tela exige).
function buildAnswers(moreIndex: number, lessIndex: number) {
  const more: Record<string, string> = {};
  const less: Record<string, string> = {};
  DISC_QUESTIONS.forEach((question, index) => {
    more[String(index + 1)] = question.options[moreIndex].value;
    less[String(index + 1)] = question.options[lessIndex].value;
  });
  return { more, less };
}

export const discFixtures: ModuleFixtures = {
  valid: [
    { name: "mais = 1ª opção, menos = 2ª opção", answers: buildAnswers(0, 1), expectedHeadline: "di", expectedHeadlineSecondary: "dc" },
    { name: "mais = 3ª opção, menos = 1ª opção", answers: buildAnswers(2, 0), expectedHeadline: "c", expectedHeadlineSecondary: "sc" },
  ],
  invalid: [
    { name: "nulo", answers: null },
    { name: "objeto vazio", answers: {} },
    { name: "faltam perguntas", answers: { more: { "1": "d" }, less: { "1": "i" } } },
    { name: "letra inexistente", answers: (() => { const a = buildAnswers(0, 1); a.more["1"] = "z"; return a; })() },
    { name: "mais e menos iguais na mesma pergunta", answers: (() => { const a = buildAnswers(0, 1); a.less["1"] = a.more["1"]; return a; })() },
    { name: "opção que não pertence à pergunta", answers: (() => { const a = buildAnswers(0, 1); a.more["2"] = "x"; return a; })() },
  ],
};
