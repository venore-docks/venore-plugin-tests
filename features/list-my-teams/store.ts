import { desc, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testTeamMembers, testTeams } from "../../database/schema";

export async function findTeamsByMember(userId: string) {
  return db
    .select({
      id: testTeams.id,
      name: testTeams.name,
      description: testTeams.description,
      role: testTeamMembers.role,
      createdAt: testTeams.createdAt,
    })
    .from(testTeamMembers)
    .innerJoin(testTeams, eq(testTeams.id, testTeamMembers.teamId))
    .where(eq(testTeamMembers.userId, userId))
    .orderBy(desc(testTeams.createdAt));
}
