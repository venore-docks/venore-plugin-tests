import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testInstances } from "../../database/schema";

export async function findInstanceTeam(instanceId: string): Promise<{ teamId: string | null } | undefined> {
  const [row] = await db.select({ teamId: testInstances.teamId }).from(testInstances).where(eq(testInstances.id, instanceId));
  return row;
}

export async function updateClosedAt(instanceId: string, closedAt: Date | null): Promise<void> {
  await db.update(testInstances).set({ closedAt }).where(eq(testInstances.id, instanceId));
}
