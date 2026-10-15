import type { QuestionSetContent } from "../../platform/content/types";

// Conteúdo de EXEMPLO da pesquisa de clima organizacional (escala de concordância por dimensão, uma
// pergunta de múltipla escolha e um comentário livre). Só para demonstrar a plataforma — o
// administrador substitui pelas perguntas reais em /admin/tests.

export const CLIMATE_DEMO_NOTICE = "Conteúdo de demonstração: as perguntas desta pesquisa são exemplos para mostrar o funcionamento da plataforma.";

export function climateStarterContent(): QuestionSetContent {
  const scale = (id: string, text: string, dimension: string) => ({
    id,
    text,
    kind: "scale" as const,
    required: true,
    meta: { dimension },
  });
  return {
    settings: { demo: true },
    scale: { points: 5, labels: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"] },
    questions: [
      scale("c1", "Meu gestor me orienta com clareza sobre o que se espera de mim.", "Liderança"),
      scale("c2", "Sinto que posso levar problemas ao meu gestor sem medo de represália.", "Liderança"),
      scale("c3", "As informações importantes chegam a mim a tempo.", "Comunicação"),
      scale("c4", "Minha equipe conversa abertamente sobre os problemas do trabalho.", "Comunicação"),
      scale("c5", "Meu trabalho é reconhecido quando eu entrego bons resultados.", "Reconhecimento"),
      scale("c6", "Considero justa a forma como as pessoas são avaliadas aqui.", "Reconhecimento"),
      scale("c7", "Consigo realizar meu trabalho dentro do horário previsto.", "Carga de trabalho"),
      scale("c8", "Tenho os recursos de que preciso para fazer um bom trabalho.", "Carga de trabalho"),
      scale("c9", "Sinto orgulho de fazer parte desta organização.", "Pertencimento"),
      scale("c10", "Eu me sinto parte da equipe.", "Pertencimento"),
      {
        id: "c11",
        text: "Há quanto tempo você trabalha aqui?",
        kind: "single",
        required: true,
        options: [{ id: "a", text: "Menos de 1 ano" }, { id: "b", text: "De 1 a 3 anos" }, { id: "c", text: "De 3 a 5 anos" }, { id: "d", text: "Mais de 5 anos" }],
      },
      { id: "c12", text: "O que mais poderia melhorar no seu dia a dia de trabalho? (opcional)", kind: "text", required: false },
    ],
  };
}
