import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testQuestionSetVersions, testQuestionSets } from "../../database/schema";
import type { QuestionSetContent } from "./types";

// Acesso ao conteúdo PUBLICADO — usado em tempo de execução (rodar o teste, pontuar, relatório) e
// pelos casos de uso de gestão. Só versão publicada (imutável) chega a quem responde; o rascunho
// nunca é lido por este caminho.

export type PublishedContent = { setId: string; version: number; title: string; content: QuestionSetContent };

export async function findPublishedVersion(setId: string, version: number): Promise<PublishedContent | undefined> {
  const [row] = await db
    .select()
    .from(testQuestionSetVersions)
    .where(and(eq(testQuestionSetVersions.setId, setId), eq(testQuestionSetVersions.version, version)));
  return row ? { setId: row.setId, version: row.version, title: row.title, content: row.content as QuestionSetContent } : undefined;
}

// Conjunto padrão do módulo (não arquivado e já publicado), na versão mais recente.
export async function findDefaultPublished(moduleId: string): Promise<PublishedContent | undefined> {
  const [set] = await db
    .select()
    .from(testQuestionSets)
    .where(and(eq(testQuestionSets.moduleId, moduleId), eq(testQuestionSets.isDefault, true), isNull(testQuestionSets.archivedAt)));
  if (!set || set.publishedVersion === null) return undefined;
  return findPublishedVersion(set.id, set.publishedVersion);
}

// Última versão publicada de um conjunto (não arquivado) — usada ao criar uma aplicação para fixá-la.
export async function findLatestPublished(setId: string): Promise<(PublishedContent & { moduleId: string }) | undefined> {
  const [set] = await db.select().from(testQuestionSets).where(and(eq(testQuestionSets.id, setId), isNull(testQuestionSets.archivedAt)));
  if (!set || set.publishedVersion === null) return undefined;
  const version = await findPublishedVersion(set.id, set.publishedVersion);
  return version ? { ...version, moduleId: set.moduleId } : undefined;
}

export async function listPublishedSets(moduleId: string): Promise<Array<{ id: string; title: string; version: number; isDefault: boolean }>> {
  const rows = await db
    .select()
    .from(testQuestionSets)
    .where(and(eq(testQuestionSets.moduleId, moduleId), isNull(testQuestionSets.archivedAt)))
    .orderBy(desc(testQuestionSets.isDefault), desc(testQuestionSets.updatedAt));
  return rows.flatMap((row) => (row.publishedVersion === null ? [] : [{ id: row.id, title: row.title, version: row.publishedVersion, isDefault: row.isDefault }]));
}

// Conjunto/versão que uma aplicação fixou ao ser criada (módulos authored).
export async function findInstancePin(instanceId: string): Promise<{ testId: string; questionSetId: string | null; questionSetVersion: number | null } | undefined> {
  const [row] = await db
    .select({ testId: testInstances.testId, questionSetId: testInstances.questionSetId, questionSetVersion: testInstances.questionSetVersion })
    .from(testInstances)
    .where(eq(testInstances.id, instanceId));
  return row;
}

export async function findSetModuleId(setId: string): Promise<string | undefined> {
  const [row] = await db.select({ moduleId: testQuestionSets.moduleId }).from(testQuestionSets).where(eq(testQuestionSets.id, setId));
  return row?.moduleId;
}
