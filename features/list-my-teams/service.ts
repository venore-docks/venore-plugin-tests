import { findTeamsByMember } from "./store";
import type { ListMyTeamsResult, MyTeamSummary } from "./types";

export async function listMyTeams(userId: string): Promise<ListMyTeamsResult> {
  const rows = await findTeamsByMember(userId);
  return { success: true, data: rows as MyTeamSummary[] };
}
