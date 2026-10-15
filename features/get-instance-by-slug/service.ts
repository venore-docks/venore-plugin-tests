import { findInstanceBySlug } from "./store";
import type { IdentityMode } from "../../contracts/types";
import type { GetInstanceBySlugQuery, GetInstanceBySlugResult } from "./types";

export async function getInstanceBySlug(query: GetInstanceBySlugQuery): Promise<GetInstanceBySlugResult> {
  const row = await findInstanceBySlug(query.slug);
  if (!row) {
    return { success: false, error: { code: "not_found", message: "Convite não encontrado — o link pode estar errado ou ter sido removido." } };
  }
  const { closedAt, ...rest } = row;
  return { success: true, data: { ...rest, identityMode: rest.identityMode as IdentityMode, closed: closedAt !== null } };
}
