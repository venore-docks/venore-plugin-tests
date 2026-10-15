import { and, eq, isNull } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testAttempts } from "../../database/schema";

export type AttemptRow = typeof testAttempts.$inferSelect;

export async function insertAttempt(input: {
  moduleId: string;
  instanceId: string | null;
  questionSetId: string;
  questionSetVersion: number;
  userId: string | null;
  expiresAt: Date;
}): Promise<AttemptRow> {
  const [row] = await db.insert(testAttempts).values(input).returning();
  return row;
}

export async function findOpenAttempt(attemptId: string): Promise<AttemptRow | undefined> {
  const [row] = await db.select().from(testAttempts).where(and(eq(testAttempts.id, attemptId), isNull(testAttempts.finishedAt)));
  return row;
}

export async function markAttemptFinished(attemptId: string): Promise<void> {
  await db.update(testAttempts).set({ finishedAt: new Date() }).where(eq(testAttempts.id, attemptId));
}
