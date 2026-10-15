import type { ModuleError, TestModule } from "../../platform/modules/contract";
import { DISC_HOWTO, DISC_QUESTIONS, DISC_QUESTION_BANK_VERSION, describeDiscProfile } from "./engine/questions";
import { scoreDisc, type RawDiscInput } from "./engine/score-disc";

const VALID_VALUES = new Set(["d", "i", "s", "c", "n"]);

function capitalize(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
}

// Módulo DISC — migrado do NestPro SEM mudar a pontuação (engine/score-disc.ts é a fórmula original
// e engine/score-disc.test.ts trava os números). Versão "1.0.0" = banco de perguntas
// "31.07.24.1" + fórmula original; subir a versão se QUALQUER número mudar.
export const discModule: TestModule = {
  id: "disc",
  name: "Teste DISC",
  description: "Perfil comportamental: como você age (autoimagem externa) e como gostaria de agir (autoimagem interna) em um contexto.",
  estimatedMinutes: 10,
  version: "1.0.0",
  source: {
    author: "NestPro",
    license: "Proprietária (fórmula e banco de perguntas do sistema NestPro, migrados sem alteração)",
    reference: `Banco de perguntas ${DISC_QUESTION_BANK_VERSION}; fórmula em engine/score-disc.ts`,
  },
  contentKind: "static",
  defaultEnabled: true,
  help: { title: DISC_HOWTO.title, html: DISC_HOWTO.content },
  howToRead: {
    title: "Como ler este relatório",
    html: `<div class="space-y-2"><p><span>As letras</span> D, I, S e C são Dominância, Influência, Estabilidade e Conformidade. A sigla do perfil (por exemplo, Sc) lista, em ordem, os estilos que mais se destacam.</p><p><span>Autoimagem externa</span> é como você age no contexto informado; <span>autoimagem interna</span> é como você gostaria de agir. O gráfico de colunas e o gráfico de superfície comparam as duas.</p><p><span>Escala de estresse</span> mede a distância entre a autoimagem externa e a interna: baixa (até 40), média (41 a 60), alta (61 a 80) e muito alta (acima de 80).</p><p><span>Importante:</span> o resultado vale para o contexto em que você respondeu. Em outro ambiente, o perfil pode ser diferente.</p></div>`,
  },

  validateAnswers(answers: unknown): ModuleError | null {
    const input = answers as Partial<RawDiscInput> | null;
    const more = input?.more;
    const less = input?.less;
    if (!more || !less || typeof more !== "object" || typeof less !== "object") {
      return { code: "invalid_answers", message: "Respostas em formato inválido." };
    }

    const expected = DISC_QUESTIONS.length;
    const moreCount = Object.keys(more).length;
    const lessCount = Object.keys(less).length;
    if (moreCount !== expected || lessCount !== expected) {
      return {
        code: "incomplete_answers",
        message: `O teste tem ${expected} perguntas — respostas incompletas (mais: ${moreCount}, menos: ${lessCount}).`,
      };
    }

    for (let number = 1; number <= expected; number += 1) {
      const key = String(number);
      const moreValue = more[key];
      const lessValue = less[key];
      const allowed = new Set(DISC_QUESTIONS[number - 1].options.map((option) => option.value));
      if (!VALID_VALUES.has(moreValue) || !VALID_VALUES.has(lessValue) || !allowed.has(moreValue) || !allowed.has(lessValue)) {
        return { code: "invalid_answers", message: `Resposta inválida na pergunta ${number}.` };
      }
      if (moreValue === lessValue) {
        return { code: "invalid_answers", message: `Na pergunta ${number}, "mais" e "menos" não podem ser a mesma opção.` };
      }
    }

    return null;
  },

  score(answers: unknown) {
    const dataset = scoreDisc(answers as RawDiscInput);
    return { dataset, headline: dataset.more.profile, headlineSecondary: dataset.less.profile };
  },

  describeHeadline(headline: string): string {
    const profile = describeDiscProfile(headline);
    return profile ? `${profile.profile} (${capitalize(headline)})` : headline.toUpperCase();
  },
};
