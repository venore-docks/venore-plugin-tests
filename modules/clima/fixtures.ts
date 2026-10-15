import type { ModuleFixtures } from "../../platform/modules/fixtures";
import { climateStarterContent } from "./content";

const content = climateStarterContent();
const AGREE = Object.fromEntries(content.questions.map((question) => [question.id, question.kind === "scale" ? 4 : question.kind === "single" ? "b" : "Mais comunicação."]));
const { c12: _comment, ...WITHOUT_OPTIONAL } = AGREE;

export const climateFixtures: ModuleFixtures = {
  content,
  valid: [
    { name: "responde tudo", answers: AGREE, expectedHeadline: "recorded", expectedHeadlineSecondary: null },
    { name: "sem o comentário opcional", answers: WITHOUT_OPTIONAL, expectedHeadline: "recorded", expectedHeadlineSecondary: null },
  ],
  invalid: [
    { name: "nulo", answers: null },
    { name: "vazio", answers: {} },
    { name: "nota fora da escala", answers: { ...AGREE, c1: 9 } },
    { name: "falta uma obrigatória", answers: (() => { const a = { ...AGREE }; delete (a as Record<string, unknown>).c3; return a; })() },
  ],
};
