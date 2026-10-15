import type { ModuleFixtures } from "../../platform/modules/fixtures";
import { bigFiveStarterContent } from "./content";

const content = bigFiveStarterContent();

function answers(pick: (meta: { trait: string; reverse: boolean }) => number) {
  return Object.fromEntries(content.questions.map((question) => [question.id, pick({ trait: String(question.meta?.trait), reverse: question.meta?.reverse === true })]));
}

export const bigFiveFixtures: ModuleFixtures = {
  content,
  valid: [
    // Concordar com tudo: itens invertidos cancelam os normais — todos os traços em 50%, ordem O C E A N.
    { name: "concorda com tudo", answers: answers(() => 5), expectedHeadline: "O", expectedHeadlineSecondary: "C" },
    // Neuroticismo coerente no topo, o resto no meio.
    { name: "neuroticismo em destaque", answers: answers(({ trait, reverse }) => (trait === "N" ? (reverse ? 1 : 5) : 3)), expectedHeadline: "N", expectedHeadlineSecondary: "O" },
  ],
  invalid: [
    { name: "nulo", answers: null },
    { name: "vazio", answers: {} },
    { name: "falta um item", answers: (() => { const a = answers(() => 3); delete a.bf1; return a; })() },
    { name: "valor fora da escala", answers: (() => { const a = answers(() => 3); a.bf1 = 9; return a; })() },
    { name: "item que não existe", answers: { ...answers(() => 3), outro: 3 } },
  ],
};
