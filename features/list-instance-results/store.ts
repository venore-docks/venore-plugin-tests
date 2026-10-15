import { desc, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testResults } from "../../database/schema";

export async function findInstanceHeader(instanceId: string) {
  const [row] = await db
    .select({
      id: testInstances.id,
      testId: testInstances.testId,
      teamId: testInstances.teamId,
      title: testInstances.title,
      contextLabel: testInstances.contextLabel,
    })
    .from(testInstances)
    .where(eq(testInstances.id, instanceId));
  return row;
}

export async function findResultsByInstance(instanceId: string) {
  return db
    .select({
      id: testResults.id,
      headline: testResults.headline,
      headlineSecondary: testResults.headlineSecondary,
      participantName: testResults.participantName,
      participantEmail: testResults.participantEmail,
      createdAt: testResults.createdAt,
    })
    .from(testResults)
    .where(eq(testResults.instanceId, instanceId))
    .orderBy(desc(testResults.createdAt));
}
