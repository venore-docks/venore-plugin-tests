import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testResults } from "../../database/schema";

export async function findInstancesByTeam(teamId: string) {
  const instances = await db
    .select({
      id: testInstances.id,
      testId: testInstances.testId,
      title: testInstances.title,
      contextLabel: testInstances.contextLabel,
      shareSlug: testInstances.shareSlug,
      closedAt: testInstances.closedAt,
      createdAt: testInstances.createdAt,
    })
    .from(testInstances)
    .where(eq(testInstances.teamId, teamId))
    .orderBy(desc(testInstances.createdAt));

  if (instances.length === 0) return [];

  const counts = await db
    .select({ instanceId: testResults.instanceId, total: count() })
    .from(testResults)
    .where(
      inArray(
        testResults.instanceId,
        instances.map((instance) => instance.id),
      ),
    )
    .groupBy(testResults.instanceId);

  const totalByInstance = new Map(counts.map((row) => [row.instanceId, Number(row.total)]));
  return instances.map((instance) => ({ ...instance, responseCount: totalByInstance.get(instance.id) ?? 0 }));
}
