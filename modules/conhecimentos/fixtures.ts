import type { ModuleFixtures } from "../../platform/modules/fixtures";
import { knowledgeStarterContent } from "./content";

const content = knowledgeStarterContent();
const ALL_RIGHT = { k1: "a", k2: "c", k3: ["a", "c"], k4: "a", k5: "a", k6: "a", k7: ["a", "c"], k8: "b" };
const ALL_WRONG = { k1: "b", k2: "a", k3: ["b"], k4: "b", k5: "b", k6: "b", k7: ["b"], k8: "a" };

export const knowledgeFixtures: ModuleFixtures = {
  content,
  valid: [
    { name: "gabarito completo", answers: ALL_RIGHT, expectedHeadline: "100", expectedHeadlineSecondary: "approved" },
    { name: "tudo errado", answers: ALL_WRONG, expectedHeadline: "0", expectedHeadlineSecondary: "failed" },
  ],
  invalid: [
    { name: "nulo", answers: null },
    { name: "vazio (obrigatórias sem resposta)", answers: {} },
    { name: "opção inexistente", answers: { ...ALL_RIGHT, k1: "zzz" } },
    { name: "várias opções numa pergunta de resposta única", answers: { ...ALL_RIGHT, k1: ["a", "b"] } },
    { name: "resposta repetida na múltipla escolha", answers: { ...ALL_RIGHT, k3: ["a", "a"] } },
  ],
};
