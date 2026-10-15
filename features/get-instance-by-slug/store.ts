import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances, testTeams } from "../../database/schema";

export async function findInstanceBySlug(slug: string) {
  const [row] = await db
    .select({
      id: testInstances.id,
      testId: testInstances.testId,
      title: testInstances.title,
      contextLabel: testInstances.contextLabel,
      teamName: testTeams.name,
      redirectUrl: testInstances.redirectUrl,
      identityMode: testInstances.identityMode,
      showResultToParticipant: testInstances.showResultToParticipant,
      closedAt: testInstances.closedAt,
    })
    .from(testInstances)
    .leftJoin(testTeams, eq(testTeams.id, testInstances.teamId))
    .where(eq(testInstances.shareSlug, slug));
  return row;
}
