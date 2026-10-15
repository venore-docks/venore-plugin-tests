import { isTeamMember } from "../../platform/team-access";
import { findInstancesByTeam } from "./store";
import type { ListTeamInstancesQuery, ListTeamInstancesResult } from "./types";

export async function listTeamInstances(query: ListTeamInstancesQuery): Promise<ListTeamInstancesResult> {
  if (!(await isTeamMember(query.teamId, query.actorId))) {
    return { success: false, error: { code: "forbidden", message: "Você não faz parte desta equipe." } };
  }
  const rows = await findInstancesByTeam(query.teamId);
  return {
    success: true,
    data: rows.map(({ closedAt, ...row }) => ({ ...row, closed: closedAt !== null })),
  };
}
