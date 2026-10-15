import { and, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testTeamMembers, testTeams } from "../../database/schema";
import type { TestTeamMemberRole, TestTeamRecord } from "../../contracts/types";

export async function findTeamWithRole(teamId: string, userId: string): Promise<{ team: TestTeamRecord; role: TestTeamMemberRole } | undefined> {
  const [row] = await db
    .select({ team: testTeams, role: testTeamMembers.role })
    .from(testTeamMembers)
    .innerJoin(testTeams, eq(testTeams.id, testTeamMembers.teamId))
    .where(and(eq(testTeamMembers.teamId, teamId), eq(testTeamMembers.userId, userId)));
  return row ? { team: row.team as TestTeamRecord, role: row.role as TestTeamMemberRole } : undefined;
}

export async function teamExists(teamId: string): Promise<boolean> {
  const [row] = await db.select({ id: testTeams.id }).from(testTeams).where(eq(testTeams.id, teamId));
  return Boolean(row);
}
