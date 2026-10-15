import { and, eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { testTeamMembers } from "../database/schema";

// Acesso por equipe — compartilhado pelos features que precisam saber "este usuário é da equipe?".
export async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: testTeamMembers.id })
    .from(testTeamMembers)
    .where(and(eq(testTeamMembers.teamId, teamId), eq(testTeamMembers.userId, userId)));
  return Boolean(row);
}

// "admin" da equipe (dono e quem ele promover) pode criar instâncias, reabrir respostas e
// desativar links; "member" só acompanha. Papel de domínio do plugin, não permissão do core.
export async function isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: testTeamMembers.id })
    .from(testTeamMembers)
    .where(and(eq(testTeamMembers.teamId, teamId), eq(testTeamMembers.userId, userId), eq(testTeamMembers.role, "admin")));
  return Boolean(row);
}
