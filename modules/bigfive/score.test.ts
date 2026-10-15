import { describe, expect, it } from "vitest";
import type { QuestionnaireAnswers } from "../../platform/content/types";
import { bigFiveStarterContent } from "./content";
import { scoreBigFive } from "./score";

const content = bigFiveStarterContent();

function answersFor(pick: (meta: { trait: string; reverse: boolean }) => number): QuestionnaireAnswers {
  return Object.fromEntries(content.questions.map((question) => [question.id, pick({ trait: String(question.meta?.trait), reverse: question.meta?.reverse === true })]));
}

describe("scoreBigFive", () => {
  it("concordar com tudo: itens normais no topo, invertidos no piso — a média fica no meio", () => {
    const result = scoreBigFive(content, answersFor(() => 5));
    // metade dos itens de cada traço é invertida: (5 + 1 + 5 + 1) / 4 = 3 → 50%
    expect(Object.values(result.traits).map((trait) => trait.percent)).toEqual([50, 50, 50, 50, 50]);
    expect(result.ranking).toEqual(["O", "C", "E", "A", "N"]);
  });

  it("resposta coerente com o traço (concorda com o normal, discorda do invertido) dá 100%", () => {
    const result = scoreBigFive(content, answersFor(({ reverse }) => (reverse ? 1 : 5)));
    expect(Object.values(result.traits).every((trait) => trait.percent === 100 && trait.mean === 5)).toBe(true);
  });

  it("inversão: discordar do item invertido conta como concordar com o traço", () => {
    const onlyC = answersFor(({ trait, reverse }) => (trait === "C" ? (reverse ? 1 : 5) : 3));
    const result = scoreBigFive(content, onlyC);
    expect(result.traits.C.percent).toBe(100);
    expect(result.traits.O.percent).toBe(50);
    expect(result.ranking[0]).toBe("C");
  });

  it("ordena do maior para o menor, desempatando pela ordem O C E A N", () => {
    const result = scoreBigFive(content, answersFor(({ trait, reverse }) => (trait === "N" ? (reverse ? 1 : 5) : trait === "E" ? (reverse ? 2 : 4) : 3)));
    expect(result.ranking.slice(0, 2)).toEqual(["N", "E"]);
    expect(result.ranking.slice(2)).toEqual(["O", "C", "A"]);
  });

  it("respeita a quantidade de pontos da escala do conjunto (editável)", () => {
    const sevenPoints = { ...content, scale: { points: 7, labels: ["1", "2", "3", "4", "5", "6", "7"] } };
    const result = scoreBigFive(sevenPoints, answersFor(({ reverse }) => (reverse ? 1 : 7)));
    expect(result.traits.O).toMatchObject({ percent: 100, mean: 7 });
    expect(result.scalePoints).toBe(7);
  });
});
