import type { ModuleError } from "../modules/contract";
import type { QuestionSetContent, QuestionnaireAnswers } from "./types";

const MAX_TEXT_ANSWER = 2000;

// Confere as respostas de um questionário contra o conteúdo PUBLICADO: formato por tipo de pergunta,
// ids que existem, escala dentro dos pontos, obrigatórias preenchidas. Quem chama decide o que é
// aceitável quando o tempo acabou (allowPartial: respostas faltando viram "não respondida").
export function validateQuestionnaireAnswers(
  content: QuestionSetContent,
  answers: unknown,
  options: { allowPartial?: boolean } = {},
): ModuleError | null {
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    return { code: "invalid_answers", message: "Respostas em formato inválido." };
  }
  const given = answers as Record<string, unknown>;
  const questionIds = new Set(content.questions.map((question) => question.id));
  for (const key of Object.keys(given)) {
    if (!questionIds.has(key)) return { code: "invalid_answers", message: "Há resposta para uma pergunta que não existe." };
  }

  for (const [index, question] of content.questions.entries()) {
    const value = given[question.id];
    const number = index + 1;
    const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

    if (empty) {
      if (question.required && !options.allowPartial) return { code: "incomplete_answers", message: `Responda a pergunta ${number}.` };
      continue;
    }

    if (question.kind === "single") {
      if (typeof value !== "string" || !question.options?.some((option) => option.id === value)) {
        return { code: "invalid_answers", message: `Resposta inválida na pergunta ${number}.` };
      }
    } else if (question.kind === "multiple") {
      if (!Array.isArray(value) || new Set(value).size !== value.length) return { code: "invalid_answers", message: `Resposta inválida na pergunta ${number}.` };
      const valid = new Set(question.options?.map((option) => option.id));
      if (!value.every((item) => typeof item === "string" && valid.has(item))) return { code: "invalid_answers", message: `Resposta inválida na pergunta ${number}.` };
    } else if (question.kind === "scale") {
      const points = content.scale?.points ?? 0;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > points) {
        return { code: "invalid_answers", message: `Resposta inválida na pergunta ${number}.` };
      }
    } else if (typeof value !== "string" || value.length > MAX_TEXT_ANSWER) {
      return { code: "invalid_answers", message: `Resposta inválida na pergunta ${number}.` };
    }
  }
  return null;
}

// Devolve só as respostas conhecidas e já no formato final (descarta vazias) — o que a plataforma
// grava e o módulo pontua.
export function cleanAnswers(content: QuestionSetContent, answers: QuestionnaireAnswers): QuestionnaireAnswers {
  const out: QuestionnaireAnswers = {};
  for (const question of content.questions) {
    const value = answers[question.id];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    out[question.id] = typeof value === "string" && question.kind === "text" ? value.trim() : value;
  }
  return out;
}
