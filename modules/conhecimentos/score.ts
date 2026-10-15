import type { QuestionSetContent, QuestionnaireAnswers } from "../../platform/content/types";

export type KnowledgeItem = {
  id: string;
  text: string;
  points: number;
  earned: number;
  correct: boolean;
  answered: boolean;
  // Textos (não ids) do que a pessoa marcou e do gabarito: o relatório é autossuficiente mesmo se o
  // conjunto de perguntas for arquivado ou editado depois.
  chosen: string[];
  right: string[];
  explanation: string | null;
};

export type KnowledgeDataset = {
  demo: boolean;
  earned: number;
  max: number;
  percent: number;
  passScore: number;
  passed: boolean;
  correctCount: number;
  questionCount: number;
  // Tempo limite em minutos (0 = sem limite), quanto a pessoa levou e se enviou depois do prazo.
  timeLimitMinutes: number;
  elapsedSeconds: number | null;
  late: boolean;
  items: KnowledgeItem[];
};

// Margem para a latência da rede entre o fim do relógio e a chegada do envio.
export const KNOWLEDGE_GRACE_SECONDS = 30;

// Pontuação por questão: resposta única vale `points` se a opção marcada for a correta; múltipla
// escolha vale `points` só se o conjunto marcado for EXATAMENTE o gabarito (tudo ou nada — marcar
// uma errada anula). Sem resposta = 0. A nota é earned/max em %; passou se percent ≥ passScore.
export function scoreKnowledge(
  content: QuestionSetContent,
  answers: QuestionnaireAnswers,
  timing: { elapsedSeconds: number | null; timeLimitSeconds: number | null },
): KnowledgeDataset {
  let earned = 0;
  let max = 0;
  let correctCount = 0;

  const items: KnowledgeItem[] = content.questions.map((question) => {
    const points = typeof question.meta?.points === "number" ? question.meta.points : 1;
    max += points;

    const options = question.options ?? [];
    const given = answers[question.id];
    const chosenIds = Array.isArray(given) ? given : typeof given === "string" ? [given] : [];
    const rightIds = options.filter((option) => option.correct).map((option) => option.id);
    const answered = chosenIds.length > 0;
    const correct = answered && chosenIds.length === rightIds.length && rightIds.every((id) => chosenIds.includes(id));
    if (correct) {
      earned += points;
      correctCount += 1;
    }

    const textOf = (id: string) => options.find((option) => option.id === id)?.text ?? id;
    return {
      id: question.id,
      text: question.text,
      points,
      earned: correct ? points : 0,
      correct,
      answered,
      chosen: chosenIds.map(textOf),
      right: rightIds.map(textOf),
      explanation: typeof question.meta?.explanation === "string" && question.meta.explanation ? question.meta.explanation : null,
    };
  });

  const passScore = typeof content.settings.passScore === "number" ? content.settings.passScore : 70;
  const percent = max > 0 ? Math.round((earned / max) * 100) : 0;
  const timeLimitMinutes = typeof content.settings.timeLimitMinutes === "number" ? content.settings.timeLimitMinutes : 0;

  return {
    demo: content.settings.demo === true,
    earned,
    max,
    percent,
    passScore,
    passed: percent >= passScore,
    correctCount,
    questionCount: content.questions.length,
    timeLimitMinutes,
    elapsedSeconds: timing.elapsedSeconds,
    late: timing.timeLimitSeconds !== null && timing.elapsedSeconds !== null && timing.elapsedSeconds > timing.timeLimitSeconds + KNOWLEDGE_GRACE_SECONDS,
    items,
  };
}
