import { findTeamWithRole, teamExists } from "./store";
import type { GetTeamQuery, GetTeamResult } from "./types";

export async function getTeam(query: GetTeamQuery): Promise<GetTeamResult> {
  const found = await findTeamWithRole(query.teamId, query.actorId);
  if (!found) {
    const exists = await teamExists(query.teamId);
    return exists
      ? { success: false, error: { code: "forbidden", message: "Você não faz parte desta equipe." } }
      : { success: false, error: { code: "not_found", message: "Equipe não encontrada." } };
  }
  return { success: true, data: { ...found.team, viewerRole: found.role } };
}
