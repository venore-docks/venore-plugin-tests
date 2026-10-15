import type { QuestionSetContent, RunnerContent } from "./types";

// Conteúdo que vai para o NAVEGADOR de quem responde: sem gabarito (`correct`) e sem `meta` (traço,
// pontos, "invertido"… denunciariam a pontuação). Regra 3 de docs/modulos.md: gabarito nunca sai do
// servidor.
export function toRunnerContent(content: QuestionSetContent, ref: { setId: string; version: number }): RunnerContent {
  return {
    setId: ref.setId,
    version: ref.version,
    settings: content.settings,
    scale: content.scale,
    questions: content.questions.map((question) => ({
      id: question.id,
      text: question.text,
      kind: question.kind,
      required: question.required,
      options: question.options?.map((option) => ({ id: option.id, text: option.text })),
    })),
  };
}
