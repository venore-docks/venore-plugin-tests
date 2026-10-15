import { beginOperation, endOperation } from "@venore/plugin-sdk/observability";
import { insertTeamWithOwner } from "./store";
import type { CreateTeamCommand, CreateTeamResult } from "./types";

export async function createTeam(command: CreateTeamCommand): Promise<CreateTeamResult> {
  const handle = beginOperation({
    useCase: "tests.create-team",
    actor: { id: command.actorId, type: "user" },
    kind: "write",
  });

  const team = await insertTeamWithOwner({
    name: command.name.trim(),
    description: command.description?.trim() || null,
    ownerUserId: command.actorId,
  });

  endOperation(handle, { success: true });
  return { success: true, data: team };
}
