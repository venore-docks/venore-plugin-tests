import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testResults } from "../../database/schema";
import type { IdentityMode, TestResultRecord } from "../../contracts/types";

export type InstanceForSubmit = {
  id: string;
  testId: string;
  contextLabel: string;
  identityMode: IdentityMode;
  showResultToParticipant: boolean;
  redirectUrl: string | null;
  closed: boolean;
};

export async function findInstanceForSubmit(instanceId: string): Promise<InstanceForSubmit | undefined> {
  const [row] = await db
    .select({
      id: testInstances.id,
      testId: testInstances.testId,
      contextLabel: testInstances.contextLabel,
      identityMode: testInstances.identityMode,
      showResultToParticipant: testInstances.showResultToParticipant,
      redirectUrl: testInstances.redirectUrl,
      closedAt: testInstances.closedAt,
    })
    .from(testInstances)
    .where(eq(testInstances.id, instanceId));
  if (!row) return undefined;
  const { closedAt, ...rest } = row;
  return { ...rest, identityMode: rest.identityMode as IdentityMode, closed: closedAt !== null };
}

export async function hasResultForEmail(instanceId: string, emailKey: string): Promise<boolean> {
  const [row] = await db
    .select({ id: testResults.id })
    .from(testResults)
    .where(and(eq(testResults.instanceId, instanceId), eq(testResults.participantEmailKey, emailKey)));
  return Boolean(row);
}

export async function hasResultForUser(instanceId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: testResults.id })
    .from(testResults)
    .where(and(eq(testResults.instanceId, instanceId), eq(testResults.userId, userId)));
  return Boolean(row);
}

export async function insertResult(input: {
  testId: string;
  testVersion: string;
  userId: string | null;
  instanceId: string | null;
  contextLabel: string;
  participantName: string | null;
  participantEmail: string | null;
  participantEmailKey: string | null;
  dataset: unknown;
  headline: string;
  headlineSecondary: string | null;
  unclaimedExpiresAt: Date | null;
  questionSetId: string | null;
  questionSetVersion: number | null;
}): Promise<TestResultRecord> {
  const [row] = await db.insert(testResults).values(input).returning();
  return row as unknown as TestResultRecord;
}

// Faxina oportunista de respostas avulsas que ninguém reivindicou (login nunca feito) — roda a cada
// envio em vez de depender de um agendador do core. Só toca linha com prazo vencido e sem dono.
export async function deleteExpiredUnclaimedResults(now: Date): Promise<void> {
  await db
    .delete(testResults)
    .where(and(isNotNull(testResults.unclaimedExpiresAt), lt(testResults.unclaimedExpiresAt, now)));
}

// Violação de UNIQUE do Postgres (código 23505), venha direto do driver ou embrulhada pelo drizzle.
export function isUniqueViolation(error: unknown): boolean {
  const candidate = error as { code?: string; cause?: { code?: string } } | null;
  return candidate?.code === "23505" || candidate?.cause?.code === "23505";
}
