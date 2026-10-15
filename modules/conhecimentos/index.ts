import { cleanAnswers, validateQuestionnaireAnswers } from "../../platform/content/validate-answers";
import type { QuestionnaireAnswers } from "../../platform/content/types";
import type { ModuleError, ScoreContext, TestModule } from "../../platform/modules/contract";
import { knowledgeStarterContent } from "./content";
import { KNOWLEDGE_GRACE_SECONDS, scoreKnowledge, type KnowledgeDataset } from "./score";

// Módulo Teste de conhecimentos — conteúdo EDITÁVEL (perguntas, respostas, quantidade de respostas,
// gabarito, pontos por questão, tempo limite e nota de corte). Gabarito nunca sai do servidor.
export const knowledgeModule: TestModule = {
  id: "conhecimentos",
  name: "Teste de conhecimentos",
  description: "Perguntas de múltipla escolha com gabarito, pontuação, nota de corte e tempo limite opcional.",
  estimatedMinutes: 10,
  version: "1.0.0",
  source: {
    author: "Venore (conteúdo de demonstração)",
    license: "Perguntas de exemplo próprias. O banco de perguntas real é do administrador, que responde pela autoria e pela licença do conteúdo.",
  },
  contentKind: "authored",
  defaultEnabled: false,
  // Candidato de vaga normalmente não vê a nota; o RH vê. Em equipe o líder pode deixar visível.
  defaultShowResultToParticipant: true,
  help: {
    title: "Como funciona",
    html: "<div class=\"space-y-2\"><p>Leia cada pergunta e marque a resposta. Algumas permitem <span>mais de uma</span> resposta correta.</p><p>Se o teste tiver <span>tempo limite</span>, um cronômetro aparece no topo; ao terminar o tempo, suas respostas são enviadas automaticamente.</p></div>",
  },
  howToRead: {
    title: "Como ler este relatório",
    html: "<div class=\"space-y-2\"><p>A <span>nota</span> é a porcentagem de pontos obtidos; <span>aprovado</span> significa nota igual ou acima da nota de corte do teste.</p><p>Em perguntas de várias respostas, só vale ponto quando todas as corretas e nenhuma errada foram marcadas.</p></div>",
  },
  authoring: {
    allowedKinds: ["single", "multiple"],
    optionsHaveCorrect: true,
    minQuestions: 1,
    maxQuestions: 100,
    minOptions: 2,
    maxOptions: 8,
    questionFields: [
      { key: "points", label: "Pontos", type: "number", required: true, min: 1, max: 100, defaultValue: 1 },
      { key: "explanation", label: "Explicação (aparece no resultado)", type: "text" },
    ],
    setFields: [
      { key: "timeLimitMinutes", label: "Tempo limite em minutos (0 = sem limite)", type: "number", required: true, min: 0, max: 240, defaultValue: 0 },
      { key: "passScore", label: "Nota de corte (%)", type: "number", required: true, min: 0, max: 100, defaultValue: 70 },
      { key: "shuffleQuestions", label: "Embaralhar a ordem das perguntas", type: "boolean", defaultValue: false },
      { key: "shuffleOptions", label: "Embaralhar a ordem das respostas", type: "boolean", defaultValue: true },
      { key: "demo", label: "Conteúdo de demonstração (mostra um aviso no relatório)", type: "boolean", defaultValue: false },
    ],
    starterContent: knowledgeStarterContent,
  },

  validateAnswers(answers: unknown, context: ScoreContext): ModuleError | null {
    if (!context.content) return { code: "no_content", message: "Este teste ainda não tem perguntas publicadas." };
    // Passou do tempo: o que foi respondido vale, o resto fica em branco.
    const expired =
      context.timeLimitSeconds != null && context.elapsedSeconds != null && context.elapsedSeconds >= context.timeLimitSeconds - 1;
    return validateQuestionnaireAnswers(context.content, answers, { allowPartial: expired });
  },

  score(answers: unknown, context: ScoreContext) {
    if (!context.content) throw new Error("conhecimentos: pontuação sem conteúdo");
    const clean = cleanAnswers(context.content, answers as QuestionnaireAnswers);
    const dataset = scoreKnowledge(context.content, clean, {
      elapsedSeconds: context.elapsedSeconds ?? null,
      timeLimitSeconds: context.timeLimitSeconds ?? null,
    });
    return { dataset, headline: String(dataset.percent), headlineSecondary: dataset.passed ? "approved" : "failed" };
  },

  describeHeadline(headline: string, headlineSecondary: string | null) {
    const verdict = headlineSecondary === "approved" ? "Aprovado" : headlineSecondary === "failed" ? "Reprovado" : null;
    return `${headline}%${verdict ? ` · ${verdict}` : ""}`;
  },
};

export { KNOWLEDGE_GRACE_SECONDS };
export type { KnowledgeDataset };
