import type { QuestionSetContent, QuestionnaireAnswers } from "../../platform/content/types";
import { BIG_FIVE_TRAITS, type BigFiveTraitCode } from "./content";

export type BigFiveTraitScore = {
  code: BigFiveTraitCode;
  // Média das respostas já com os itens invertidos corrigidos, na escala do conjunto (1..pontos).
  mean: number;
  // 0–100: posição da média dentro da escala ((média − 1) / (pontos − 1)).
  percent: number;
  items: number;
};

export type BigFiveDataset = {
  demo: boolean;
  scalePoints: number;
  traits: Record<BigFiveTraitCode, BigFiveTraitScore>;
  // Códigos dos traços do maior para o menor percentual (empate: ordem O, C, E, A, N).
  ranking: BigFiveTraitCode[];
};

// Pontuação do Big Five por traço: cada item é de UM traço (meta.trait) e pode ser invertido
// (meta.reverse: concordar indica MENOS do traço, então o valor vira pontos + 1 − valor). A pontuação
// do traço é a média dos itens respondidos; o percentual é só a média reescalada para 0–100 — não é
// norma nem percentil populacional.
export function scoreBigFive(content: QuestionSetContent, answers: QuestionnaireAnswers): BigFiveDataset {
  const points = content.scale?.points ?? 5;
  const sums = new Map<BigFiveTraitCode, { total: number; count: number }>();

  for (const question of content.questions) {
    const trait = question.meta?.trait as BigFiveTraitCode | undefined;
    const value = answers[question.id];
    if (!trait || typeof value !== "number") continue;
    const adjusted = question.meta?.reverse === true ? points + 1 - value : value;
    const current = sums.get(trait) ?? { total: 0, count: 0 };
    sums.set(trait, { total: current.total + adjusted, count: current.count + 1 });
  }

  const traits = {} as Record<BigFiveTraitCode, BigFiveTraitScore>;
  for (const { code } of BIG_FIVE_TRAITS) {
    const entry = sums.get(code);
    const mean = entry && entry.count > 0 ? entry.total / entry.count : 0;
    const percent = entry && entry.count > 0 && points > 1 ? Math.round(((mean - 1) / (points - 1)) * 100) : 0;
    traits[code] = { code, mean: Math.round(mean * 100) / 100, percent, items: entry?.count ?? 0 };
  }

  const order = BIG_FIVE_TRAITS.map((trait) => trait.code);
  const ranking = [...order].sort((a, b) => traits[b].percent - traits[a].percent || order.indexOf(a) - order.indexOf(b));

  return { demo: content.settings.demo === true, scalePoints: points, traits, ranking };
}
