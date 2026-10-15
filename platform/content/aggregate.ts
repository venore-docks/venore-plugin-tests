import type { QuestionKind, QuestionSetContent, QuestionnaireAnswers } from "./types";

// Agregado de respostas de um questionário (pesquisa de clima, retrato do grupo): por pergunta,
// quantas pessoas escolheram cada resposta / a distribuição e a média da escala / os textos livres.
// Função pura — a regra de "só mostrar com N respostas" é de quem chama (ver MIN_RESPONSES_FOR_ANONYMOUS).

export type QuestionAggregate = {
  id: string;
  text: string;
  kind: QuestionKind;
  answered: number;
  options?: Array<{ id: string; text: string; count: number; percent: number }>;
  scale?: { points: number; labels: string[]; distribution: number[]; mean: number | null };
  // Respostas livres em ordem ALFABÉTICA (a ordem de chegada identificaria quem escreveu).
  texts?: string[];
};

// Pesquisa anônima só mostra resultado com pelo menos este número de respostas: com menos, dá para
// deduzir quem respondeu o quê por exclusão.
export const MIN_RESPONSES_FOR_ANONYMOUS = 5;

export function aggregateAnswers(content: QuestionSetContent, answersList: QuestionnaireAnswers[]): QuestionAggregate[] {
  return content.questions.map((question) => {
    const values = answersList.map((answers) => answers[question.id]).filter((value) => value !== undefined);
    const aggregate: QuestionAggregate = { id: question.id, text: question.text, kind: question.kind, answered: values.length };

    if (question.kind === "single" || question.kind === "multiple") {
      const counts = new Map<string, number>();
      for (const value of values) {
        for (const id of Array.isArray(value) ? value : [value]) counts.set(String(id), (counts.get(String(id)) ?? 0) + 1);
      }
      aggregate.options = (question.options ?? []).map((option) => {
        const count = counts.get(option.id) ?? 0;
        return { id: option.id, text: option.text, count, percent: values.length ? Math.round((count / values.length) * 100) : 0 };
      });
    } else if (question.kind === "scale") {
      const points = content.scale?.points ?? 0;
      const distribution = Array.from({ length: points }, () => 0);
      let sum = 0;
      for (const value of values) {
        if (typeof value === "number" && value >= 1 && value <= points) {
          distribution[value - 1] += 1;
          sum += value;
        }
      }
      aggregate.scale = { points, labels: content.scale?.labels ?? [], distribution, mean: values.length ? Math.round((sum / values.length) * 100) / 100 : null };
    } else {
      aggregate.texts = values.filter((value): value is string => typeof value === "string" && value.trim() !== "").sort((a, b) => a.localeCompare(b, "pt-BR"));
    }
    return aggregate;
  });
}
