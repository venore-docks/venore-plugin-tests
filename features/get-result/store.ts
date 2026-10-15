import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testResults, testTeams } from "../../database/schema";
import type { TestResultRecord } from "../../contracts/types";

export type ResultWithContext = {
  result: TestResultRecord;
  teamId: string | null;
  teamName: string | null;
  instanceTitle: string | null;
};

export async function findResultWithContext(resultId: string): Promise<ResultWithContext | undefined> {
  const [row] = await db
    .select({
      result: testResults,
      teamId: testInstances.teamId,
      teamName: testTeams.name,
      instanceTitle: testInstances.title,
    })
    .from(testResults)
    .leftJoin(testInstances, eq(testInstances.id, testResults.instanceId))
    .leftJoin(testTeams, eq(testTeams.id, testInstances.teamId))
    .where(eq(testResults.id, resultId));
  return row ? { ...row, result: row.result as unknown as TestResultRecord } : undefined;
}
