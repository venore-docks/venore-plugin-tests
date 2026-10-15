// MODELO DE CONTEÚDO EDITÁVEL — o que um módulo "authored" (Big Five, Conhecimentos, Clima…) usa no
// lugar de perguntas fixas no código. Um conjunto de perguntas é editado no admin (rascunho) e
// PUBLICADO em versões imutáveis; aplicações e resultados apontam para (conjunto, versão), então
// editar depois nunca muda o que já foi respondido.
//
// Tudo aqui é JSON puro (vai para jsonb). Nenhum tipo depende de um módulo específico: o que é
// próprio de cada teste (traço do Big Five, pontos de uma questão, dimensão do clima) vive em
// `meta` / `settings`, descrito por FieldDef no AuthoringSpec do módulo.

import type { ModuleError } from "../modules/contract";

export type FieldValue = string | number | boolean;

// Tipos de pergunta. "single"/"multiple" têm opções (quantidade editável); "scale" usa a escala do
// conjunto (nº de pontos e rótulos editáveis); "text" é resposta livre.
export type QuestionKind = "single" | "multiple" | "scale" | "text";

export type QuestionOption = {
  id: string;
  text: string;
  // Só faz sentido quando o módulo declara optionsHaveCorrect (ex.: Conhecimentos). Nunca vai para o
  // navegador de quem responde (ver runner-content.ts).
  correct?: boolean;
};

export type Question = {
  id: string;
  text: string;
  kind: QuestionKind;
  required: boolean;
  options?: QuestionOption[];
  // Campos próprios do módulo (declarados em AuthoringSpec.questionFields).
  meta?: Record<string, FieldValue>;
};

export type ScaleDefinition = {
  // Quantidade de pontos da escala (ex.: 5 = "discordo totalmente" … "concordo totalmente").
  points: number;
  // Um rótulo por ponto, do menor para o maior (labels.length === points).
  labels: string[];
};

export type QuestionSetContent = {
  // Configurações do conjunto (declaradas em AuthoringSpec.setFields): tempo limite, nota de corte…
  settings: Record<string, FieldValue>;
  scale?: ScaleDefinition;
  questions: Question[];
};

// Descrição de um campo extra que o editor desenha (por pergunta ou do conjunto).
export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  min?: number;
  max?: number;
  help?: string;
  defaultValue?: FieldValue;
};

// O que um módulo "authored" declara para a plataforma montar o editor e validar o conteúdo.
export type AuthoringSpec = {
  allowedKinds: QuestionKind[];
  optionsHaveCorrect: boolean;
  minQuestions: number;
  maxQuestions: number;
  minOptions: number;
  maxOptions: number;
  // Quando "scale" é permitido: limites da quantidade de pontos da escala.
  scalePoints?: { min: number; max: number };
  questionFields: FieldDef[];
  setFields: FieldDef[];
  // Regras do módulo além das genéricas, conferidas ao PUBLICAR (ex.: Big Five exige itens em cada traço).
  validateContent?(content: QuestionSetContent): ModuleError[];
  // Conteúdo de EXEMPLO (mockup): o que "Criar conjunto de exemplo" grava. Precisa passar na
  // validação de publicação do próprio módulo.
  starterContent(): QuestionSetContent;
};

// Respostas de um questionário: id da pergunta → valor. single = id da opção; multiple = ids das
// opções; scale = ponto escolhido (1..points); text = texto.
export type AnswerValue = string | string[] | number;
export type QuestionnaireAnswers = Record<string, AnswerValue>;

// O que o NAVEGADOR de quem responde recebe: o conteúdo sem gabarito (`correct`) e sem `meta`
// (traço, pontos, "invertido"… denunciam a pontuação).
export type RunnerQuestion = {
  id: string;
  text: string;
  kind: QuestionKind;
  required: boolean;
  options?: Array<{ id: string; text: string }>;
};

export type RunnerContent = {
  setId: string;
  version: number;
  settings: Record<string, FieldValue>;
  scale?: ScaleDefinition;
  questions: RunnerQuestion[];
};

// Referência fixa ao conteúdo usado numa aplicação/resposta.
export type ContentRef = { setId: string; version: number };
