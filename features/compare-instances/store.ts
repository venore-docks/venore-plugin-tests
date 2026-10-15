import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testResults } from "../../database/schema";

export async function findInstanceForCompare(instanceId: string) {
  const [row] = await db
    .select({
      id: testInstances.id,
      title: testInstances.title,
      contextLabel: testInstances.contextLabel,
      testId: testInstances.testId,
      teamId: testInstances.teamId,
      createdAt: testInstances.createdAt,
    })
    .from(testInstances)
    .where(eq(testInstances.id, instanceId));
  return row;
}

export async function findComparableResults(instanceId: string) {
  return db
    .select({
      id: testResults.id,
      userId: testResults.userId,
      participantName: testResults.participantName,
      participantEmail: testResults.participantEmail,
      participantEmailKey: testResults.participantEmailKey,
      headline: testResults.headline,
      headlineSecondary: testResults.headlineSecondary,
    })
    .from(testResults)
    .where(eq(testResults.instanceId, instanceId));
}
