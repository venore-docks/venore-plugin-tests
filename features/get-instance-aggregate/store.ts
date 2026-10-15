import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testResults } from "../../database/schema";

export async function findInstanceForAggregate(instanceId: string) {
  const [row] = await db
    .select({
      id: testInstances.id,
      testId: testInstances.testId,
      teamId: testInstances.teamId,
      title: testInstances.title,
      contextLabel: testInstances.contextLabel,
      identityMode: testInstances.identityMode,
      questionSetId: testInstances.questionSetId,
      questionSetVersion: testInstances.questionSetVersion,
    })
    .from(testInstances)
    .where(eq(testInstances.id, instanceId));
  return row;
}

export async function findDatasets(instanceId: string): Promise<unknown[]> {
  const rows = await db.select({ dataset: testResults.dataset }).from(testResults).where(eq(testResults.instanceId, instanceId));
  return rows.map((row) => row.dataset);
}
