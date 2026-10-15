import { cleanAnswers, validateQuestionnaireAnswers } from "../../platform/content/validate-answers";
import type { QuestionnaireAnswers } from "../../platform/content/types";
import type { ModuleError, ScoreContext, TestModule } from "../../platform/modules/contract";
import { climateStarterContent } from "./content";

// Módulo Pesquisa de clima — conteúdo EDITÁVEL e resposta ANÔNIMA: aplicações deste teste nascem em
// modo "anonymous" (não pedem nome nem e-mail) e o líder vê só o AGREGADO, e só depois de um mínimo
// de respostas (aggregateOnly). Não há resultado individual para o participante.
export const climateModule: TestModule = {
  id: "clima",
  name: "Pesquisa de clima",
  description: "Pesquisa de clima organizacional anônima: o grupo vê o resultado agregado por pergunta, nunca por pessoa.",
  estimatedMinutes: 6,
  version: "1.0.0",
  source: {
    author: "Venore (conteúdo de demonstração)",
    license: "Perguntas de exemplo próprias. As perguntas reais são do administrador, que responde pela autoria e pela licença do conteúdo.",
  },
  contentKind: "authored",
  defaultEnabled: false,
  defaultIdentityMode: "anonymous",
  defaultShowResultToParticipant: false,
  aggregateOnly: true,
  help: {
    title: "Como funciona",
    html: "<div class=\"space-y-2\"><p>Esta pesquisa é <span>anônima</span>: não pedimos seu nome nem seu e-mail, e os resultados só aparecem somados, depois que um número mínimo de pessoas responde.</p><p>Responda com sinceridade — não há resposta certa ou errada.</p></div>",
  },
  authoring: {
    allowedKinds: ["scale", "single", "multiple", "text"],
    optionsHaveCorrect: false,
    minQuestions: 3,
    maxQuestions: 80,
    minOptions: 2,
    maxOptions: 10,
    scalePoints: { min: 3, max: 7 },
    questionFields: [{ key: "dimension", label: "Dimensão (ex.: Liderança)", type: "text" }],
    setFields: [{ key: "demo", label: "Conteúdo de demonstração (mostra um aviso no relatório)", type: "boolean", defaultValue: false }],
    starterContent: climateStarterContent,
  },

  validateAnswers(answers: unknown, context: ScoreContext): ModuleError | null {
    if (!context.content) return { code: "no_content", message: "Esta pesquisa ainda não tem perguntas publicadas." };
    return validateQuestionnaireAnswers(context.content, answers);
  },

  score(answers: unknown, context: ScoreContext) {
    if (!context.content) throw new Error("clima: pontuação sem conteúdo");
    const clean = cleanAnswers(context.content, answers as QuestionnaireAnswers);
    // Não há "nota": o dataset guarda as respostas para o agregado (platform/content/aggregate.ts).
    return { dataset: { demo: context.content.settings.demo === true, answers: clean }, headline: "recorded", headlineSecondary: null };
  },

  describeHeadline() {
    return "Resposta registrada";
  },
};
