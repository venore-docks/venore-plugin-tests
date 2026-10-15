import { isDeepStrictEqual } from "node:util";
import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { normalizeContent, validateContent } from "../../platform/content/validate-content";
import type { AuthoringSpec, QuestionSetContent } from "../../platform/content/types";
import type { ModuleError, TestModule } from "../../platform/modules/contract";
import { getModule } from "../../platform/modules/registry";
import {
  archiveSet,
  countInstancesBySet,
  countUsage,
  deleteSet,
  findDefaultSetRow,
  findSet,
  findVersionContent,
  insertSet,
  listSetsByModule,
  listVersions,
  makeDefault,
  publishNextVersion,
  updateDraft,
  type SetRow,
} from "./store";
import type {
  CreateQuestionSetInput,
  CreateQuestionSetResult,
  CreateStarterInput,
  CreateStarterResult,
  DeleteInput,
  DeleteResult,
  DuplicateInput,
  DuplicateResult,
  GetQuestionSetResult,
  ListQuestionSetsResult,
  PublishInput,
  PublishResult,
  SaveDraftInput,
  SaveDraftResult,
  SetDefaultInput,
  SetDefaultResult,
} from "./types";

type Failure = { success: false; error: ModuleError };
const fail = (code: string, message: string): Failure => ({ success: false, error: { code, message } });

function authoredModule(moduleId: string): { module: TestModule; spec: AuthoringSpec } | Failure {
  const module = getModule(moduleId);
  if (!module) return fail("module_not_found", "Esse teste não existe.");
  if (module.contentKind !== "authored" || !module.authoring) return fail("module_not_authored", "Esse teste tem conteúdo fixo — não há o que editar.");
  return { module, spec: module.authoring };
}

// Conteúdo vazio de um conjunto novo: configurações no valor padrão, escala no menor tamanho
// permitido (rótulos em branco para o editor preencher).
export function blankContent(spec: AuthoringSpec): QuestionSetContent {
  const settings: QuestionSetContent["settings"] = {};
  for (const field of spec.setFields) {
    if (field.defaultValue !== undefined) settings[field.key] = field.defaultValue;
  }
  const content: QuestionSetContent = { settings, questions: [] };
  if (spec.allowedKinds.includes("scale")) {
    const points = spec.scalePoints?.min ?? 5;
    content.scale = { points, labels: Array.from({ length: points }, () => "") };
  }
  return content;
}

function problemsFor(spec: AuthoringSpec, draft: QuestionSetContent): ModuleError[] {
  return validateContent(draft, spec, "publish");
}

async function hasChanges(row: SetRow, title: string): Promise<boolean> {
  if (row.publishedVersion === null) return true;
  const published = await findVersionContent(row.id, row.publishedVersion);
  return !published || !isDeepStrictEqual(published, row.draft) || title !== row.title;
}

export async function listQuestionSets(moduleId: string): Promise<ListQuestionSetsResult> {
  const authored = authoredModule(moduleId);
  if ("success" in authored) return authored;

  const [rows, usage] = await Promise.all([listSetsByModule(moduleId), countInstancesBySet(moduleId)]);
  const summaries = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      moduleId: row.moduleId,
      title: row.title,
      description: row.description,
      publishedVersion: row.publishedVersion,
      hasUnpublishedChanges: await hasChanges(row, row.title),
      isDefault: row.isDefault,
      archived: row.archivedAt !== null,
      questionCount: (row.draft as QuestionSetContent).questions?.length ?? 0,
      instanceCount: usage.get(row.id) ?? 0,
      updatedAt: row.updatedAt,
    })),
  );
  return { success: true, data: summaries };
}

export async function getQuestionSet(setId: string): Promise<GetQuestionSetResult> {
  const row = await findSet(setId);
  if (!row) return fail("not_found", "Conjunto de perguntas não encontrado.");
  const authored = authoredModule(row.moduleId);
  if ("success" in authored) return authored;

  const [versions, usage] = await Promise.all([listVersions(row.id), countUsage(row.id)]);
  const draft = row.draft as QuestionSetContent;
  return {
    success: true,
    data: {
      id: row.id,
      moduleId: row.moduleId,
      title: row.title,
      description: row.description,
      publishedVersion: row.publishedVersion,
      hasUnpublishedChanges: await hasChanges(row, row.title),
      isDefault: row.isDefault,
      archived: row.archivedAt !== null,
      draft,
      versions,
      instanceCount: usage.instances,
      resultCount: usage.results,
      publishProblems: problemsFor(authored.spec, draft),
    },
  };
}

export async function createQuestionSet(input: CreateQuestionSetInput, actorId: string): Promise<CreateQuestionSetResult> {
  const authored = authoredModule(input.moduleId);
  if ("success" in authored) return authored;
  const title = input.title.trim();
  if (title.length < 2 || title.length > 120) return fail("invalid_title", "Dê um título ao conjunto (de 2 a 120 caracteres).");

  const row = await insertSet({
    moduleId: input.moduleId,
    title,
    description: input.description?.trim().slice(0, 500) || null,
    draft: blankContent(authored.spec),
    createdByUserId: actorId,
  });
  return { success: true, data: { id: row.id } };
}

export async function saveDraft(input: SaveDraftInput, actorId: string): Promise<SaveDraftResult> {
  const handle = beginOperation({ useCase: "tests.save-question-set-draft", actor: { id: actorId, type: "user" }, kind: "write" });
  const finish = <T extends { success: boolean }>(result: T): T => {
    endOperation(handle, result.success ? { success: true } : { success: false, error: (result as unknown as Failure).error });
    return result;
  };

  const row = await findSet(input.setId);
  if (!row) return finish(fail("not_found", "Conjunto de perguntas não encontrado."));
  if (row.archivedAt) return finish(fail("archived", "Este conjunto está arquivado e não pode mais ser editado."));
  const authored = authoredModule(row.moduleId);
  if ("success" in authored) return finish(authored);

  const title = input.title.trim();
  if (title.length < 2 || title.length > 120) return finish(fail("invalid_title", "Dê um título ao conjunto (de 2 a 120 caracteres)."));

  const content = normalizeContent(input.content);
  if (!content) return finish(fail("invalid_content", "O conteúdo enviado está em formato inválido."));
  const structural = validateContent(content, authored.spec, "draft");
  if (structural.length > 0) return finish(fail("invalid_content", structural.slice(0, 5).map((error) => error.message).join(" ")));

  await updateDraft(row.id, { title, description: input.description?.trim().slice(0, 500) || null, draft: content });
  const fresh = await findSet(row.id);
  return finish({
    success: true as const,
    data: { publishProblems: problemsFor(authored.spec, content), hasUnpublishedChanges: fresh ? await hasChanges(fresh, title) : true },
  });
}

export async function publishQuestionSet(input: PublishInput, actorId: string): Promise<PublishResult> {
  const row = await findSet(input.setId);
  if (!row) return fail("not_found", "Conjunto de perguntas não encontrado.");
  if (row.archivedAt) return fail("archived", "Este conjunto está arquivado.");
  const authored = authoredModule(row.moduleId);
  if ("success" in authored) return authored;

  const draft = row.draft as QuestionSetContent;
  const problems = problemsFor(authored.spec, draft);
  if (problems.length > 0) {
    return fail("cannot_publish", `Ainda não dá para publicar: ${problems.slice(0, 5).map((error) => error.message).join(" ")}`);
  }
  if (!(await hasChanges(row, row.title))) return fail("nothing_to_publish", "Não há alterações novas para publicar.");

  const version = await publishNextVersion(row.id, draft, row.title, actorId);
  return { success: true, data: { version } };
}

export async function setDefaultQuestionSet(input: SetDefaultInput): Promise<SetDefaultResult> {
  const row = await findSet(input.setId);
  if (!row) return fail("not_found", "Conjunto de perguntas não encontrado.");
  if (row.archivedAt) return fail("archived", "Este conjunto está arquivado.");
  if (row.publishedVersion === null) return fail("not_published", "Publique o conjunto antes de torná-lo o padrão.");

  await makeDefault(row.moduleId, row.id);
  return { success: true, data: { setId: row.id } };
}

export async function duplicateQuestionSet(input: DuplicateInput, actorId: string): Promise<DuplicateResult> {
  const row = await findSet(input.setId);
  if (!row) return fail("not_found", "Conjunto de perguntas não encontrado.");
  const copy = await insertSet({
    moduleId: row.moduleId,
    title: `Cópia de ${row.title}`.slice(0, 120),
    description: row.description,
    draft: row.draft as QuestionSetContent,
    createdByUserId: actorId,
  });
  return { success: true, data: { id: copy.id } };
}

// Apaga se NINGUÉM usou (nenhuma aplicação nem resposta); senão arquiva — o histórico continua legível.
export async function deleteQuestionSet(input: DeleteInput): Promise<DeleteResult> {
  const row = await findSet(input.setId);
  if (!row) return fail("not_found", "Conjunto de perguntas não encontrado.");

  const usage = await countUsage(row.id);
  if (usage.instances === 0 && usage.results === 0) {
    await deleteSet(row.id);
    return { success: true, data: { action: "deleted" } };
  }
  await archiveSet(row.id);
  return { success: true, data: { action: "archived" } };
}

// "Criar conjunto de exemplo": grava e PUBLICA o conteúdo de demonstração do módulo e o torna o
// padrão — só se o módulo ainda não tem padrão. Serve para o teste funcionar de imediato; o
// administrador edita ou substitui depois.
export async function createStarterQuestionSet(input: CreateStarterInput, actorId: string): Promise<CreateStarterResult> {
  const authored = authoredModule(input.moduleId);
  if ("success" in authored) return authored;

  const existing = await findDefaultSetRow(input.moduleId);
  if (existing) return { success: true, data: { id: existing.id, created: false } };

  const content = authored.spec.starterContent();
  const problems = problemsFor(authored.spec, content);
  if (problems.length > 0) return fail("starter_invalid", `O conteúdo de exemplo deste módulo está inválido: ${problems[0].message}`);

  const row = await insertSet({ moduleId: input.moduleId, title: `${authored.module.name} (exemplo)`, description: "Conteúdo de demonstração — substitua pelo conteúdo real.", draft: content, createdByUserId: actorId });
  await publishNextVersion(row.id, content, row.title, actorId);
  await makeDefault(input.moduleId, row.id);
  return { success: true, data: { id: row.id, created: true } };
}
