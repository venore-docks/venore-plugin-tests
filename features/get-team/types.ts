import type { OperationResult } from "@venore/plugin-sdk";
import type { TestTeamMemberRole, TestTeamRecord } from "../../contracts/types";

export type GetTeamQuery = { teamId: string; actorId: string };
// viewerRole = papel de quem pediu (a UI usa para mostrar ou esconder ações de líder).
export type TeamView = TestTeamRecord & { viewerRole: TestTeamMemberRole };
export type GetTeamResult = OperationResult<TeamView>;
