import type { OperationResult } from "@venore/plugin-sdk";

export type TeamInstanceSummary = {
  id: string;
  testId: string;
  title: string | null;
  contextLabel: string;
  shareSlug: string;
  closed: boolean;
  responseCount: number;
  createdAt: Date;
};

export type ListTeamInstancesQuery = { teamId: string; actorId: string };
export type ListTeamInstancesResult = OperationResult<TeamInstanceSummary[]>;
