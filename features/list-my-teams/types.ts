import type { OperationResult } from "@venore/plugin-sdk";
import type { TestTeamMemberRole } from "../../contracts/types";

export type MyTeamSummary = {
  id: string;
  name: string;
  description: string | null;
  role: TestTeamMemberRole;
  createdAt: Date;
};

export type ListMyTeamsResult = OperationResult<MyTeamSummary[]>;
