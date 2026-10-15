import type { QuestionSetContent } from "../../platform/content/types";

// Conteúdo de EXEMPLO do teste de conhecimentos (perguntas gerais, só para demonstrar a plataforma:
// resposta única, múltipla escolha, pontos, explicação e tempo limite). O administrador substitui
// pelo banco de perguntas real em /admin/tests.

export const KNOWLEDGE_DEMO_NOTICE =
  "Conteúdo de demonstração: as perguntas deste teste são exemplos para mostrar o funcionamento da plataforma.";

export function knowledgeStarterContent(): QuestionSetContent {
  return {
    settings: { timeLimitMinutes: 10, passScore: 70, shuffleQuestions: false, shuffleOptions: true, demo: true },
    questions: [
      {
        id: "k1",
        text: "Qual é a capital do Brasil?",
        kind: "single",
        required: true,
        meta: { points: 1, explanation: "Brasília é a capital federal desde 1960." },
        options: [{ id: "a", text: "Brasília", correct: true }, { id: "b", text: "Rio de Janeiro" }, { id: "c", text: "São Paulo" }, { id: "d", text: "Salvador" }],
      },
      {
        id: "k2",
        text: "Quanto é 15% de 200?",
        kind: "single",
        required: true,
        meta: { points: 1, explanation: "15% de 200 = 0,15 × 200 = 30." },
        options: [{ id: "a", text: "15" }, { id: "b", text: "20" }, { id: "c", text: "30", correct: true }, { id: "d", text: "45" }],
      },
      {
        id: "k3",
        text: "Quais destes números são primos?",
        kind: "multiple",
        required: true,
        meta: { points: 2, explanation: "2 e 11 só são divisíveis por 1 e por eles mesmos; 9 = 3×3 e 15 = 3×5." },
        options: [{ id: "a", text: "2", correct: true }, { id: "b", text: "9" }, { id: "c", text: "11", correct: true }, { id: "d", text: "15" }],
      },
      {
        id: "k4",
        text: "Qual destas frases está escrita corretamente?",
        kind: "single",
        required: true,
        meta: { points: 1, explanation: "\"Haver\" no sentido de existir é impessoal: fica no singular." },
        options: [{ id: "a", text: "Houve muitos problemas.", correct: true }, { id: "b", text: "Houveram muitos problemas." }, { id: "c", text: "Haviam muitos problemas." }, { id: "d", text: "Fazem dois anos que cheguei." }],
      },
      {
        id: "k5",
        text: "Em uma planilha, qual função soma um intervalo de células?",
        kind: "single",
        required: true,
        meta: { points: 1 },
        options: [{ id: "a", text: "SOMA", correct: true }, { id: "b", text: "MÉDIA" }, { id: "c", text: "MÁXIMO" }, { id: "d", text: "CONT.SE" }],
      },
      {
        id: "k6",
        text: "O que significa a sigla LGPD?",
        kind: "single",
        required: true,
        meta: { points: 1 },
        options: [
          { id: "a", text: "Lei Geral de Proteção de Dados", correct: true },
          { id: "b", text: "Lei Geral de Políticas Digitais" },
          { id: "c", text: "Linha Geral de Privacidade e Dados" },
          { id: "d", text: "Lei de Governança e Proteção Digital" },
        ],
      },
      {
        id: "k7",
        text: "Quais são boas práticas de segurança da informação?",
        kind: "multiple",
        required: true,
        meta: { points: 2, explanation: "Senhas únicas e verificação em duas etapas reduzem o risco; compartilhar senha ou reutilizá-la, não." },
        options: [
          { id: "a", text: "Usar senhas longas e diferentes em cada serviço", correct: true },
          { id: "b", text: "Reutilizar a mesma senha em todos os sites" },
          { id: "c", text: "Ativar a verificação em duas etapas", correct: true },
          { id: "d", text: "Compartilhar a senha com colegas de confiança" },
        ],
      },
      {
        id: "k8",
        text: "Quantos minutos há em 2,5 horas?",
        kind: "single",
        required: true,
        meta: { points: 1 },
        options: [{ id: "a", text: "120" }, { id: "b", text: "150", correct: true }, { id: "c", text: "180" }, { id: "d", text: "250" }],
      },
    ],
  };
}
