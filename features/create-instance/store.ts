import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances } from "../../database/schema";
import { generateShortSlug } from "../../shared/short-slug";
import type { IdentityMode, TestInstanceRecord } from "../../contracts/types";

export async function findInstanceByExternalRef(externalRef: string): Promise<TestInstanceRecord | undefined> {
  const [row] = await db.select().from(testInstances).where(eq(testInstances.externalRef, externalRef));
  return row as TestInstanceRecord | undefined;
}

const MAX_SLUG_ATTEMPTS = 5;

// Retry no colisão do slug curto (8 caracteres base36 — colisão é rara, mas não impossível) em vez
// de checar disponibilidade antes: menos uma ida ao banco no caminho feliz, e o UNIQUE constraint
// já garante a corrida contra outra instância sendo criada ao mesmo tempo.
export async function insertInstanceWithUniqueSlug(input: {
  testId: string;
  teamId: string | null;
  title: string | null;
  contextLabel: string;
  createdByUserId: string | null;
  redirectUrl: string | null;
  externalRef: string | null;
  identityMode: IdentityMode;
  showResultToParticipant: boolean;
  questionSetId: string | null;
  questionSetVersion: number | null;
}): Promise<TestInstanceRecord> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    try {
      const [row] = await db
        .insert(testInstances)
        .values({ ...input, shareSlug: generateShortSlug() })
        .returning();
      return row as TestInstanceRecord;
    } catch (error) {
      lastError = error;
      // Corrida na externalRef (duas chamadas simultâneas com a mesma referência): devolve a que ganhou.
      if (input.externalRef) {
        const existing = await findInstanceByExternalRef(input.externalRef);
        if (existing) return existing;
      }
    }
  }
  throw lastError;
}
