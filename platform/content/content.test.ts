import { describe, expect, it } from "vitest";
import { aggregateAnswers } from "./aggregate";
import { toRunnerContent } from "./runner-content";
import { cleanAnswers, validateQuestionnaireAnswers } from "./validate-answers";
import { normalizeContent, validateContent } from "./validate-content";
import type { AuthoringSpec, QuestionSetContent } from "./types";

const spec: AuthoringSpec = {
  allowedKinds: ["single", "multiple", "scale"],
  optionsHaveCorrect: true,
  minQuestions: 1,
  maxQuestions: 10,
  minOptions: 2,
  maxOptions: 5,
  scalePoints: { min: 3, max: 7 },
  questionFields: [{ key: "points", label: "Pontos", type: "number", required: true, min: 1, max: 10 }],
  setFields: [{ key: "passScore", label: "Nota de corte", type: "number", required: true, min: 0, max: 100 }],
  starterContent: () => ({ settings: { passScore: 70 }, questions: [] }),
};

function content(overrides: Partial<QuestionSetContent> = {}): QuestionSetContent {
  return {
    settings: { passScore: 70 },
    scale: { points: 5, labels: ["a", "b", "c", "d", "e"] },
    questions: [
      { id: "q1", text: "Capital do Brasil?", kind: "single", required: true, meta: { points: 2 }, options: [{ id: "a", text: "Brasília", correct: true }, { id: "b", text: "Rio" }] },
      { id: "q2", text: "Primos?", kind: "multiple", required: true, meta: { points: 1 }, options: [{ id: "a", text: "2", correct: true }, { id: "b", text: "3", correct: true }, { id: "c", text: "4" }] },
      { id: "q3", text: "Gosto de estudar", kind: "scale", required: false, meta: { points: 1 } },
    ],
    ...overrides,
  };
}

describe("validateContent", () => {
  it("aceita conteúdo bem formado (publicação)", () => {
    expect(validateContent(content(), spec, "publish")).toEqual([]);
  });

  it("publicação exige mínimos, gabarito, campos obrigatórios e escala completa", () => {
    const broken = content({
      scale: { points: 5, labels: ["a", "b"] },
      questions: [
        { id: "q1", text: "", kind: "single", required: true, options: [{ id: "a", text: "só uma" }] },
        { id: "q2", text: "Escala", kind: "scale", required: true, meta: { points: 1 } },
      ],
    });
    const messages = validateContent(broken, spec, "publish").map((error) => error.message).join(" | ");
    expect(messages).toContain("escreva o enunciado");
    expect(messages).toContain("precisa de 2 a 5 respostas");
    expect(messages).toContain("UMA resposta correta");
    expect(messages).toContain("\"Pontos\" é obrigatório");
    expect(messages).toContain("rótulo para cada ponto");
  });

  it("rascunho aceita conteúdo incompleto, mas recusa estrutura quebrada", () => {
    expect(validateContent(content({ questions: [{ id: "q1", text: "", kind: "single", required: true, options: [] }] }), spec, "draft")).toEqual([]);
    const duplicated = content({
      questions: [
        { id: "q1", text: "a", kind: "single", required: true, options: [{ id: "x", text: "1" }, { id: "x", text: "2" }] },
        { id: "q1", text: "b", kind: "text" as never, required: true },
      ],
    });
    const messages = validateContent(duplicated, spec, "draft").map((error) => error.message).join(" | ");
    expect(messages).toContain("identificador repetido");
    expect(messages).toContain("não aceita perguntas do tipo");
  });

  it("recusa duas respostas iguais e valor de campo fora do limite", () => {
    const messages = validateContent(
      content({ settings: { passScore: 150 }, questions: [{ id: "q1", text: "x", kind: "single", required: true, meta: { points: 1 }, options: [{ id: "a", text: "Sim", correct: true }, { id: "b", text: "sim" }] }] }),
      spec,
      "publish",
    ).map((error) => error.message).join(" | ");
    expect(messages).toContain("duas respostas iguais");
    expect(messages).toContain("entre 0 e 100");
  });

  it("roda as regras do próprio módulo só na publicação", () => {
    const strict: AuthoringSpec = { ...spec, validateContent: () => [{ code: "invalid_content", message: "regra do módulo" }] };
    expect(validateContent(content(), strict, "draft")).toEqual([]);
    expect(validateContent(content(), strict, "publish")).toEqual([{ code: "invalid_content", message: "regra do módulo" }]);
  });
});

describe("normalizeContent (JSON não confiável do editor)", () => {
  it("descarta lixo, aparada texto e dá ids", () => {
    const normalized = normalizeContent({
      settings: { passScore: 70, evil: { x: 1 }, "bad key": 1 },
      questions: [{ text: "  Pergunta   com   espaços ", kind: "single", options: [{ text: " A " }, { text: "B", correct: true }, "lixo"], meta: { points: 3, nested: {} } }, 42],
    });
    expect(normalized?.settings).toEqual({ passScore: 70 });
    expect(normalized?.questions[0]).toMatchObject({ id: "q1", text: "Pergunta com espaços", kind: "single", required: true, meta: { points: 3 } });
    expect(normalized?.questions[0].options?.map((option) => [option.text, option.correct])).toEqual([["A", undefined], ["B", true], ["", undefined]]);
    expect(normalized?.questions[1]).toMatchObject({ id: "q2", text: "", kind: "single" });
  });

  it("recusa o que não é conteúdo", () => {
    expect(normalizeContent(null)).toBeNull();
    expect(normalizeContent({ questions: "x" })).toBeNull();
    expect(normalizeContent([])).toBeNull();
  });
});

describe("validateQuestionnaireAnswers", () => {
  const c = content();

  it("aceita respostas válidas e opcional vazia", () => {
    expect(validateQuestionnaireAnswers(c, { q1: "a", q2: ["a", "b"] })).toBeNull();
    expect(validateQuestionnaireAnswers(c, { q1: "a", q2: ["a"], q3: 4 })).toBeNull();
  });

  it("recusa obrigatória faltando, opção inexistente, escala fora e pergunta desconhecida", () => {
    expect(validateQuestionnaireAnswers(c, { q1: "a" })).toMatchObject({ code: "incomplete_answers" });
    expect(validateQuestionnaireAnswers(c, { q1: "zzz", q2: ["a"] })).toMatchObject({ code: "invalid_answers" });
    expect(validateQuestionnaireAnswers(c, { q1: "a", q2: ["a", "a"] })).toMatchObject({ code: "invalid_answers" });
    expect(validateQuestionnaireAnswers(c, { q1: "a", q2: ["a"], q3: 9 })).toMatchObject({ code: "invalid_answers" });
    expect(validateQuestionnaireAnswers(c, { q1: "a", q2: ["a"], extra: "x" })).toMatchObject({ code: "invalid_answers" });
    expect(validateQuestionnaireAnswers(c, null)).toMatchObject({ code: "invalid_answers" });
  });

  it("tempo esgotado: aceita respostas faltando", () => {
    expect(validateQuestionnaireAnswers(c, { q1: "a" }, { allowPartial: true })).toBeNull();
  });

  it("cleanAnswers descarta vazias e apara texto livre", () => {
    expect(cleanAnswers(c, { q1: "a", q2: [], q3: 3 })).toEqual({ q1: "a", q3: 3 });
  });
});

describe("conteúdo que vai ao navegador", () => {
  it("nunca leva gabarito nem meta", () => {
    const runner = toRunnerContent(content(), { setId: "s1", version: 3 });
    const json = JSON.stringify(runner);
    expect(json).not.toContain("correct");
    expect(json).not.toContain("points\":2");
    expect(json).not.toContain("meta");
    expect(runner).toMatchObject({ setId: "s1", version: 3 });
    expect(runner.questions[0].options).toEqual([{ id: "a", text: "Brasília" }, { id: "b", text: "Rio" }]);
  });
});

describe("aggregateAnswers", () => {
  it("conta opções, distribui a escala e ordena textos livres", () => {
    const c: QuestionSetContent = {
      settings: {},
      scale: { points: 3, labels: ["baixo", "médio", "alto"] },
      questions: [
        { id: "a", text: "Escolha", kind: "single", required: true, options: [{ id: "x", text: "X" }, { id: "y", text: "Y" }] },
        { id: "b", text: "Nota", kind: "scale", required: true },
        { id: "c", text: "Comentário", kind: "text", required: false },
      ],
    };
    const result = aggregateAnswers(c, [
      { a: "x", b: 3, c: "zebra" },
      { a: "x", b: 1, c: "abelha" },
      { a: "y", b: 3 },
    ]);
    expect(result[0].options).toEqual([{ id: "x", text: "X", count: 2, percent: 67 }, { id: "y", text: "Y", count: 1, percent: 33 }]);
    expect(result[1].scale).toMatchObject({ distribution: [1, 0, 2], mean: 2.33 });
    expect(result[2].texts).toEqual(["abelha", "zebra"]);
    expect(result[2].answered).toBe(2);
  });
});
