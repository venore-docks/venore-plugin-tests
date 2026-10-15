import { describe, expect, it } from "vitest";
import { knowledgeStarterContent } from "./content";
import { scoreKnowledge } from "./score";

const content = knowledgeStarterContent();
const noTiming = { elapsedSeconds: null, timeLimitSeconds: null };
const ALL_RIGHT = { k1: "a", k2: "c", k3: ["a", "c"], k4: "a", k5: "a", k6: "a", k7: ["a", "c"], k8: "b" };

describe("scoreKnowledge", () => {
  it("gabarito completo = 100% e aprovado", () => {
    const result = scoreKnowledge(content, ALL_RIGHT, noTiming);
    expect(result).toMatchObject({ earned: 10, max: 10, percent: 100, passed: true, correctCount: 8, questionCount: 8 });
  });

  it("pontos por questão (múltipla vale 2) e nota de corte", () => {
    // acerta só k1 (1 ponto) e k3 (2 pontos) = 3 de 10 = 30% → reprovado (corte 70)
    const result = scoreKnowledge(content, { k1: "a", k3: ["a", "c"] }, noTiming);
    expect(result).toMatchObject({ earned: 3, max: 10, percent: 30, passed: false, passScore: 70 });
  });

  it("múltipla escolha é tudo ou nada: faltar uma ou marcar a mais zera a questão", () => {
    expect(scoreKnowledge(content, { k3: ["a"] }, noTiming).items[2]).toMatchObject({ correct: false, earned: 0, answered: true });
    expect(scoreKnowledge(content, { k3: ["a", "b", "c"] }, noTiming).items[2].correct).toBe(false);
    expect(scoreKnowledge(content, { k3: ["c", "a"] }, noTiming).items[2].correct).toBe(true);
  });

  it("sem resposta vale zero e fica marcada como não respondida", () => {
    const result = scoreKnowledge(content, {}, noTiming);
    expect(result.percent).toBe(0);
    expect(result.items.every((item) => !item.answered && item.earned === 0)).toBe(true);
  });

  it("guarda os TEXTOS do marcado e do gabarito (relatório autossuficiente)", () => {
    const item = scoreKnowledge(content, { k2: "a" }, noTiming).items[1];
    expect(item).toMatchObject({ chosen: ["15"], right: ["30"], correct: false, explanation: "15% de 200 = 0,15 × 200 = 30." });
  });

  it("respeita a nota de corte e os pontos EDITADOS no conjunto", () => {
    const edited = { ...content, settings: { ...content.settings, passScore: 20 }, questions: content.questions.map((q) => (q.id === "k1" ? { ...q, meta: { ...q.meta, points: 5 } } : q)) };
    const result = scoreKnowledge(edited, { k1: "a" }, noTiming);
    expect(result).toMatchObject({ earned: 5, max: 14, percent: 36, passed: true });
  });

  it("marca envio fora do prazo (com margem de 30s)", () => {
    expect(scoreKnowledge(content, ALL_RIGHT, { elapsedSeconds: 640, timeLimitSeconds: 600 }).late).toBe(true);
    expect(scoreKnowledge(content, ALL_RIGHT, { elapsedSeconds: 620, timeLimitSeconds: 600 }).late).toBe(false);
    expect(scoreKnowledge(content, ALL_RIGHT, noTiming).late).toBe(false);
  });
});
