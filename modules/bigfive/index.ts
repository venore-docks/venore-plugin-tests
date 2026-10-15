import { validateQuestionnaireAnswers, cleanAnswers } from "../../platform/content/validate-answers";
import type { QuestionnaireAnswers } from "../../platform/content/types";
import type { ModuleError, ScoreContext, TestModule } from "../../platform/modules/contract";
import { BIG_FIVE_TRAITS, bigFiveStarterContent } from "./content";
import { scoreBigFive } from "./score";

const TRAIT_OPTIONS = BIG_FIVE_TRAITS.map((trait) => ({ value: trait.code, label: `${trait.code} — ${trait.name}` }));

function noContent(): ModuleError {
  return { code: "no_content", message: "Este teste ainda não tem perguntas publicadas." };
}

// Módulo Big Five (modelo OCEAN) — conteúdo EDITÁVEL: o administrador cria/edita os itens (texto,
// traço, se é invertido, quantidade de pontos da escala) em /admin/tests. Nasce desligado e com o
// conteúdo de EXEMPLO (não validado) quando o administrador pede "Criar conjunto de exemplo".
export const bigFiveModule: TestModule = {
  id: "big-five",
  name: "Big Five (personalidade)",
  description: "Os cinco grandes fatores de personalidade: abertura, conscienciosidade, extroversão, amabilidade e neuroticismo.",
  estimatedMinutes: 8,
  version: "1.0.0",
  source: {
    author: "Venore (conteúdo de demonstração)",
    license: "Itens de exemplo próprios, sem validação psicométrica. Ao usar um instrumento real, registrar aqui autor, licença e referência.",
    reference: "Modelo dos cinco grandes fatores (OCEAN). A fórmula de pontuação (média por traço com itens invertidos) é a convencional do modelo.",
  },
  contentKind: "authored",
  defaultEnabled: false,
  help: {
    title: "Como funciona",
    html: "<div class=\"space-y-2\"><p>Você verá afirmações sobre como você costuma ser. Para cada uma, escolha o quanto concorda.</p><p>Não há resposta certa ou errada. Responda pensando em como você é <span>no contexto que escolheu</span>, não em como gostaria de ser.</p></div>",
  },
  howToRead: {
    title: "Como ler este relatório",
    html: "<div class=\"space-y-2\"><p>O relatório mostra cinco traços, cada um de 0 a 100. Esse número é a sua posição dentro da escala de respostas — <span>não é uma nota</span> nem uma comparação com outras pessoas.</p><p>Nenhum traço é \"melhor\" que outro: eles descrevem tendências. Quem pontua alto em neuroticismo, por exemplo, tende a sentir mais ansiedade e oscilação de humor.</p></div>",
  },
  authoring: {
    allowedKinds: ["scale"],
    optionsHaveCorrect: false,
    minQuestions: 10,
    maxQuestions: 120,
    minOptions: 2,
    maxOptions: 2,
    scalePoints: { min: 3, max: 9 },
    questionFields: [
      { key: "trait", label: "Traço", type: "select", options: TRAIT_OPTIONS, required: true },
      { key: "reverse", label: "Item invertido (concordar indica MENOS do traço)", type: "boolean", defaultValue: false },
    ],
    setFields: [{ key: "demo", label: "Conteúdo de demonstração (mostra um aviso no relatório)", type: "boolean", defaultValue: false }],
    validateContent(content) {
      const errors: ModuleError[] = [];
      for (const trait of BIG_FIVE_TRAITS) {
        const count = content.questions.filter((question) => question.meta?.trait === trait.code).length;
        if (count < 2) errors.push({ code: "invalid_content", message: `O traço "${trait.name}" precisa de ao menos 2 itens (tem ${count}).` });
      }
      return errors;
    },
    starterContent: bigFiveStarterContent,
  },

  validateAnswers(answers: unknown, context: ScoreContext) {
    if (!context.content) return noContent();
    return validateQuestionnaireAnswers(context.content, answers);
  },

  score(answers: unknown, context: ScoreContext) {
    if (!context.content) throw new Error("big-five: pontuação sem conteúdo");
    const clean = cleanAnswers(context.content, answers as QuestionnaireAnswers);
    const dataset = scoreBigFive(context.content, clean);
    return { dataset, headline: dataset.ranking[0], headlineSecondary: dataset.ranking[1] };
  },

  describeHeadline(headline: string, headlineSecondary: string | null) {
    const name = (code: string | null) => BIG_FIVE_TRAITS.find((trait) => trait.code === code)?.name;
    const first = name(headline);
    const second = name(headlineSecondary);
    return first ? `Destaques: ${first}${second ? ` e ${second}` : ""}` : headline;
  },
};
