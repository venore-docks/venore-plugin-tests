import { desc, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testResults } from "../../database/schema";

export async function findResultsByUser(userId: string) {
  return db
    .select({
      id: testResults.id,
      testId: testResults.testId,
      contextLabel: testResults.contextLabel,
      headline: testResults.headline,
      headlineSecondary: testResults.headlineSecondary,
      createdAt: testResults.createdAt,
    })
    .from(testResults)
    .where(eq(testResults.userId, userId))
    .orderBy(desc(testResults.createdAt));
}
