import { db } from "@venore/plugin-sdk";
import { testTeamMembers, testTeams } from "../../database/schema";
import type { TestTeamRecord } from "../../contracts/types";

export async function insertTeamWithOwner(input: { name: string; description: string | null; ownerUserId: string }): Promise<TestTeamRecord> {
  return db.transaction(async (tx) => {
    const [team] = await tx
      .insert(testTeams)
      .values({ name: input.name, description: input.description, ownerUserId: input.ownerUserId })
      .returning();

    await tx.insert(testTeamMembers).values({ teamId: team.id, userId: input.ownerUserId, role: "admin" });

    return team as TestTeamRecord;
  });
}
