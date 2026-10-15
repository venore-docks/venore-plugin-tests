import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testQuestionSetVersions, testQuestionSets, testResults } from "../../database/schema";
import type { QuestionSetContent } from "../../platform/content/types";

export type SetRow = typeof testQuestionSets.$inferSelect;

export async function listSetsByModule(moduleId: string): Promise<SetRow[]> {
  return db
    .select()
    .from(testQuestionSets)
    .where(eq(testQuestionSets.moduleId, moduleId))
    .orderBy(desc(testQuestionSets.isDefault), desc(testQuestionSets.updatedAt));
}

export async function findSet(setId: string): Promise<SetRow | undefined> {
  const [row] = await db.select().from(testQuestionSets).where(eq(testQuestionSets.id, setId));
  return row;
}

export async function listVersions(setId: string) {
  return db
    .select({ version: testQuestionSetVersions.version, title: testQuestionSetVersions.title, publishedAt: testQuestionSetVersions.publishedAt })
    .from(testQuestionSetVersions)
    .where(eq(testQuestionSetVersions.setId, setId))
    .orderBy(desc(testQuestionSetVersions.version));
}

export async function findVersionContent(setId: string, version: number): Promise<QuestionSetContent | undefined> {
  const [row] = await db
    .select({ content: testQuestionSetVersions.content })
    .from(testQuestionSetVersions)
    .where(and(eq(testQuestionSetVersions.setId, setId), eq(testQuestionSetVersions.version, version)));
  return row?.content as QuestionSetContent | undefined;
}

export async function countUsage(setId: string): Promise<{ instances: number; results: number }> {
  const [instances] = await db.select({ total: count() }).from(testInstances).where(eq(testInstances.questionSetId, setId));
  const [results] = await db.select({ total: count() }).from(testResults).where(eq(testResults.questionSetId, setId));
  return { instances: Number(instances?.total ?? 0), results: Number(results?.total ?? 0) };
}

export async function countInstancesBySet(moduleId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ setId: testInstances.questionSetId, total: count() })
    .from(testInstances)
    .where(eq(testInstances.testId, moduleId))
    .groupBy(testInstances.questionSetId);
  return new Map(rows.flatMap((row) => (row.setId ? [[row.setId, Number(row.total)] as [string, number]] : [])));
}

export async function insertSet(input: { moduleId: string; title: string; description: string | null; draft: QuestionSetContent; createdByUserId: string | null }): Promise<SetRow> {
  const [row] = await db.insert(testQuestionSets).values(input).returning();
  return row;
}

export async function updateDraft(setId: string, input: { title: string; description: string | null; draft: QuestionSetContent }): Promise<void> {
  await db
    .update(testQuestionSets)
    .set({ title: input.title, description: input.description, draft: input.draft, updatedAt: new Date() })
    .where(eq(testQuestionSets.id, setId));
}

// Publica: grava o snapshot imutável da versão seguinte e aponta o conjunto para ela. Tudo numa
// transação; a chave (setId, version) impede duas publicações simultâneas de pegarem o mesmo número.
export async function publishNextVersion(setId: string, content: QuestionSetContent, title: string, publishedByUserId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const [set] = await tx.select().from(testQuestionSets).where(eq(testQuestionSets.id, setId));
    const version = (set?.publishedVersion ?? 0) + 1;
    await tx.insert(testQuestionSetVersions).values({ setId, version, title, content, publishedByUserId });
    await tx.update(testQuestionSets).set({ publishedVersion: version, draft: content, updatedAt: new Date() }).where(eq(testQuestionSets.id, setId));
    return version;
  });
}

// Troca o padrão do módulo numa transação (o índice único parcial só admite um).
export async function makeDefault(moduleId: string, setId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(testQuestionSets).set({ isDefault: false }).where(and(eq(testQuestionSets.moduleId, moduleId), eq(testQuestionSets.isDefault, true)));
    await tx.update(testQuestionSets).set({ isDefault: true, updatedAt: new Date() }).where(eq(testQuestionSets.id, setId));
  });
}

export async function archiveSet(setId: string): Promise<void> {
  await db.update(testQuestionSets).set({ archivedAt: new Date(), isDefault: false, updatedAt: new Date() }).where(eq(testQuestionSets.id, setId));
}

export async function deleteSet(setId: string): Promise<void> {
  await db.delete(testQuestionSets).where(eq(testQuestionSets.id, setId));
}

export async function findDefaultSetRow(moduleId: string): Promise<SetRow | undefined> {
  const [row] = await db
    .select()
    .from(testQuestionSets)
    .where(and(eq(testQuestionSets.moduleId, moduleId), eq(testQuestionSets.isDefault, true), sql`${testQuestionSets.archivedAt} is null`));
  return row;
}
