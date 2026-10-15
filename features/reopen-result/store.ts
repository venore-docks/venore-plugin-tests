import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testResults } from "../../database/schema";

export async function findResultOwnership(resultId: string) {
  const [row] = await db
    .select({ id: testResults.id, instanceId: testResults.instanceId, teamId: testInstances.teamId })
    .from(testResults)
    .leftJoin(testInstances, eq(testInstances.id, testResults.instanceId))
    .where(eq(testResults.id, resultId));
  return row;
}

export async function deleteResult(resultId: string): Promise<void> {
  await db.delete(testResults).where(eq(testResults.id, resultId));
}
