import type { OperationResult } from "@venore/plugin-sdk";
import type { IdentityMode } from "../../contracts/types";

export type InstanceInviteView = {
  id: string;
  testId: string;
  title: string | null;
  contextLabel: string;
  teamName: string | null;
  redirectUrl: string | null;
  identityMode: IdentityMode;
  showResultToParticipant: boolean;
  closed: boolean;
};

export type GetInstanceBySlugQuery = { slug: string };
export type GetInstanceBySlugResult = OperationResult<InstanceInviteView>;
