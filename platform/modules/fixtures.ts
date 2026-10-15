// Formato das fixtures que TODO módulo entrega (modules/<id>/fixtures.ts) para o teste de contrato.
// Regra 4 de docs/modulos.md: sem fixtures de paridade o módulo não entra no registro.

import type { QuestionSetContent } from "../content/types";

export type ModuleFixtures = {
  // Módulos "authored": o conteúdo contra o qual as respostas das fixtures valem. Sem isto o teste
  // usa o authoring.starterContent() do módulo.
  content?: QuestionSetContent;
  // Respostas válidas com o resumo (headline) esperado — travam o caminho validar → pontuar.
  valid: Array<{ name: string; answers: unknown; expectedHeadline: string; expectedHeadlineSecondary?: string | null }>;
  // Respostas que a validação DEVE recusar (nulo, incompleta, valor fora do domínio…).
  invalid: Array<{ name: string; answers: unknown }>;
};
