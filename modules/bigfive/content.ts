import type { QuestionSetContent } from "../../platform/content/types";

// Os cinco grandes fatores de personalidade (Big Five / modelo OCEAN) e o conteúdo de EXEMPLO.
// Os itens abaixo foram escritos para DEMONSTRAÇÃO da plataforma — NÃO são um instrumento validado
// (sem normas nem validação psicométrica). Para uso real, o administrador substitui pelo banco de
// itens validado em /admin/tests (o editor aceita qualquer quantidade de itens e de pontos).

export const BIG_FIVE_TRAITS = [
  { code: "O", name: "Abertura à experiência", about: "Curiosidade, imaginação e interesse por ideias e experiências novas." },
  { code: "C", name: "Conscienciosidade", about: "Organização, disciplina e foco em cumprir o que foi planejado." },
  { code: "E", name: "Extroversão", about: "Energia nas interações sociais, sociabilidade e iniciativa em grupo." },
  { code: "A", name: "Amabilidade", about: "Cooperação, confiança e consideração pelas necessidades dos outros." },
  { code: "N", name: "Neuroticismo", about: "Tendência a vivenciar ansiedade, preocupação e oscilações de humor." },
] as const;

export type BigFiveTraitCode = (typeof BIG_FIVE_TRAITS)[number]["code"];

export const BIG_FIVE_DEMO_NOTICE =
  "Conteúdo de demonstração: os itens deste teste são exemplos para mostrar o funcionamento da plataforma, não um instrumento validado. O resultado é ilustrativo.";

type Item = { text: string; trait: BigFiveTraitCode; reverse?: boolean };

const ITEMS: Item[] = [
  { text: "Gosto de experimentar ideias e maneiras novas de fazer as coisas.", trait: "O" },
  { text: "Prefiro rotinas conhecidas a mudanças.", trait: "O", reverse: true },
  { text: "Tenho curiosidade por assuntos fora da minha área.", trait: "O" },
  { text: "Evito atividades criativas ou artísticas.", trait: "O", reverse: true },
  { text: "Costumo planejar antes de começar uma tarefa.", trait: "C" },
  { text: "Deixo coisas importantes para a última hora.", trait: "C", reverse: true },
  { text: "Cumpro os prazos e compromissos que assumo.", trait: "C" },
  { text: "Tenho dificuldade em manter minhas coisas organizadas.", trait: "C", reverse: true },
  { text: "Sinto-me à vontade puxando conversa com pessoas novas.", trait: "E" },
  { text: "Prefiro ficar em segundo plano quando estou em grupo.", trait: "E", reverse: true },
  { text: "Tenho muita energia quando estou com outras pessoas.", trait: "E" },
  { text: "Passo longos períodos sem querer falar com ninguém.", trait: "E", reverse: true },
  { text: "Costumo confiar nas boas intenções das pessoas.", trait: "A" },
  { text: "Tenho pouca paciência com os problemas dos outros.", trait: "A", reverse: true },
  { text: "Gosto de ajudar colegas mesmo quando não é minha obrigação.", trait: "A" },
  { text: "Discuto até convencer os outros de que estou certo.", trait: "A", reverse: true },
  { text: "Fico ansioso(a) com facilidade.", trait: "N" },
  { text: "Mantenho a calma em situações de pressão.", trait: "N", reverse: true },
  { text: "Meu humor muda bastante ao longo do dia.", trait: "N" },
  { text: "Raramente me sinto preocupado(a) ou tenso(a).", trait: "N", reverse: true },
];

export function bigFiveStarterContent(): QuestionSetContent {
  return {
    settings: { demo: true },
    scale: { points: 5, labels: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"] },
    questions: ITEMS.map((item, index) => ({
      id: `bf${index + 1}`,
      text: item.text,
      kind: "scale" as const,
      required: true,
      meta: { trait: item.trait, reverse: item.reverse === true },
    })),
  };
}
