import type { ModuleError } from "../modules/contract";
import type { AuthoringSpec, FieldDef, FieldValue, Question, QuestionKind, QuestionOption, QuestionSetContent, ScaleDefinition } from "./types";

const KINDS: readonly QuestionKind[] = ["single", "multiple", "scale", "text"];
const MAX_TEXT = 600;
const MAX_OPTION_TEXT = 300;
const MAX_QUESTIONS_HARD = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function cleanFieldValue(value: unknown): FieldValue | undefined {
  if (typeof value === "string") return value.trim().slice(0, 200);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  return undefined;
}

function cleanRecord(value: unknown): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  if (!isRecord(value)) return out;
  for (const [key, raw] of Object.entries(value)) {
    const clean = cleanFieldValue(raw);
    if (clean !== undefined && /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key)) out[key] = clean;
  }
  return out;
}

// Normaliza JSON NÃO CONFIÁVEL vindo do editor (navegador) para o formato do conteúdo: descarta o que
// não conhece, aparada textos, limita tamanhos. NÃO valida regras de negócio (isso é
// validateContent) — só garante que o que sobra tem o formato certo e cabe no banco.
export function normalizeContent(input: unknown): QuestionSetContent | null {
  if (!isRecord(input) || !Array.isArray(input.questions)) return null;

  const questions: Question[] = input.questions.slice(0, MAX_QUESTIONS_HARD).map((raw, index) => {
    const source = isRecord(raw) ? raw : {};
    const kind = KINDS.includes(source.kind as QuestionKind) ? (source.kind as QuestionKind) : "single";
    const question: Question = {
      id: cleanText(source.id, 60) || `q${index + 1}`,
      text: cleanText(source.text, MAX_TEXT),
      kind,
      required: source.required !== false,
    };
    if (kind === "single" || kind === "multiple") {
      const rawOptions = Array.isArray(source.options) ? source.options.slice(0, 30) : [];
      question.options = rawOptions.map((rawOption, optionIndex): QuestionOption => {
        const option = isRecord(rawOption) ? rawOption : {};
        const clean: QuestionOption = { id: cleanText(option.id, 60) || `${question.id}_o${optionIndex + 1}`, text: cleanText(option.text, MAX_OPTION_TEXT) };
        if (option.correct === true) clean.correct = true;
        return clean;
      });
    }
    const meta = cleanRecord(source.meta);
    if (Object.keys(meta).length > 0) question.meta = meta;
    return question;
  });

  const content: QuestionSetContent = { settings: cleanRecord(input.settings), questions };

  if (isRecord(input.scale)) {
    const points = typeof input.scale.points === "number" && Number.isInteger(input.scale.points) ? input.scale.points : 0;
    const labels = Array.isArray(input.scale.labels) ? input.scale.labels.slice(0, 12).map((label) => cleanText(label, 80)) : [];
    const scale: ScaleDefinition = { points, labels };
    content.scale = scale;
  }
  return content;
}

function checkField(field: FieldDef, value: FieldValue | undefined, where: string, errors: ModuleError[], mode: "draft" | "publish") {
  const missing = value === undefined || value === "";
  if (missing) {
    if (field.required && mode === "publish") errors.push({ code: "invalid_content", message: `${where}: "${field.label}" é obrigatório.` });
    return;
  }
  if (field.type === "number") {
    if (typeof value !== "number") errors.push({ code: "invalid_content", message: `${where}: "${field.label}" precisa ser um número.` });
    else if ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)) {
      errors.push({ code: "invalid_content", message: `${where}: "${field.label}" precisa estar entre ${field.min ?? "−∞"} e ${field.max ?? "∞"}.` });
    }
  } else if (field.type === "boolean") {
    if (typeof value !== "boolean") errors.push({ code: "invalid_content", message: `${where}: "${field.label}" precisa ser sim/não.` });
  } else if (field.type === "select") {
    if (!field.options?.some((option) => option.value === value)) errors.push({ code: "invalid_content", message: `${where}: valor inválido em "${field.label}".` });
  } else if (typeof value !== "string") {
    errors.push({ code: "invalid_content", message: `${where}: "${field.label}" precisa ser texto.` });
  }
}

// Valida o conteúdo contra o AuthoringSpec do módulo.
//  - "draft": só o que impede SALVAR (ids repetidos, tipo de pergunta não permitido, opções com
//    texto repetido…) — dá para salvar um rascunho incompleto.
//  - "publish": tudo, inclusive mínimos/máximos, campos obrigatórios, gabarito, escala e as regras do
//    próprio módulo (spec.validateContent). Só conteúdo que passa daqui vira versão publicada.
export function validateContent(content: QuestionSetContent, spec: AuthoringSpec, mode: "draft" | "publish"): ModuleError[] {
  const errors: ModuleError[] = [];
  const add = (message: string) => errors.push({ code: "invalid_content", message });

  const ids = new Set<string>();
  content.questions.forEach((question, index) => {
    const where = `Pergunta ${index + 1}`;
    if (ids.has(question.id)) add(`${where}: identificador repetido.`);
    ids.add(question.id);

    if (!spec.allowedKinds.includes(question.kind)) add(`${where}: este teste não aceita perguntas do tipo "${question.kind}".`);
    if (mode === "publish" && !question.text) add(`${where}: escreva o enunciado.`);

    if (question.kind === "single" || question.kind === "multiple") {
      const options = question.options ?? [];
      if (mode === "publish" && (options.length < spec.minOptions || options.length > spec.maxOptions)) {
        add(`${where}: precisa de ${spec.minOptions} a ${spec.maxOptions} respostas (tem ${options.length}).`);
      }
      const optionIds = new Set<string>();
      const optionTexts = new Set<string>();
      options.forEach((option, optionIndex) => {
        if (optionIds.has(option.id)) add(`${where}: resposta ${optionIndex + 1} com identificador repetido.`);
        optionIds.add(option.id);
        if (mode === "publish" && !option.text) add(`${where}: a resposta ${optionIndex + 1} está vazia.`);
        const key = option.text.toLowerCase();
        if (option.text && optionTexts.has(key)) add(`${where}: duas respostas iguais ("${option.text}").`);
        optionTexts.add(key);
      });
      if (mode === "publish" && spec.optionsHaveCorrect) {
        const correct = options.filter((option) => option.correct).length;
        if (question.kind === "single" && correct !== 1) add(`${where}: marque exatamente UMA resposta correta.`);
        if (question.kind === "multiple" && correct < 1) add(`${where}: marque ao menos uma resposta correta.`);
      }
    }

    for (const field of spec.questionFields) checkField(field, question.meta?.[field.key], where, errors, mode);
  });

  for (const field of spec.setFields) checkField(field, content.settings[field.key], "Configuração", errors, mode);

  const usesScale = content.questions.some((question) => question.kind === "scale");
  if (usesScale) {
    const scale = content.scale;
    const limits = spec.scalePoints ?? { min: 2, max: 10 };
    if (!scale) {
      if (mode === "publish") add("Defina a escala de respostas (quantidade de pontos e rótulos).");
    } else {
      if (scale.points < limits.min || scale.points > limits.max) {
        if (mode === "publish" || scale.points > 12) add(`A escala precisa ter de ${limits.min} a ${limits.max} pontos.`);
      }
      if (mode === "publish") {
        if (scale.labels.length !== scale.points) add("A escala precisa de um rótulo para cada ponto.");
        else if (scale.labels.some((label) => !label)) add("Há rótulos vazios na escala.");
      }
    }
  }

  if (mode === "publish") {
    if (content.questions.length < spec.minQuestions || content.questions.length > spec.maxQuestions) {
      add(`O conjunto precisa de ${spec.minQuestions} a ${spec.maxQuestions} perguntas (tem ${content.questions.length}).`);
    }
    if (errors.length === 0 && spec.validateContent) errors.push(...spec.validateContent(content));
  }

  return errors;
}
