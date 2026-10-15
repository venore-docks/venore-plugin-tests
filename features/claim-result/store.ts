import { and, eq, isNull } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testResults } from "../../database/schema";
import type { TestResultRecord } from "../../contracts/types";

export async function findResultById(resultId: string): Promise<TestResultRecord | undefined> {
  const [row] = await db.select().from(testResults).where(eq(testResults.id, resultId));
  return row as unknown as TestResultRecord | undefined;
}

// UPDATE ... WHERE user_id IS NULL AND instance_id IS NULL: só reivindica resposta AVULSA ainda
// órfã. Resposta de aplicação (equipe/vaga) é de quem identificou a aplicação, nunca vira "de quem
// abriu o link". Se outra pessoa logou primeiro (corrida rara), nenhuma linha muda e o caller trata
// como "já pertence a outra conta". Reivindicar também zera o prazo de expiração.
export async function claimResultIfUnowned(resultId: string, userId: string): Promise<TestResultRecord | undefined> {
  const [row] = await db
    .update(testResults)
    .set({ userId, unclaimedExpiresAt: null })
    .where(and(eq(testResults.id, resultId), isNull(testResults.userId), isNull(testResults.instanceId)))
    .returning();
  return row as unknown as TestResultRecord | undefined;
}
