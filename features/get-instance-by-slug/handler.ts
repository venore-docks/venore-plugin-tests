import { getInstanceBySlug } from "./service";
import type { GetInstanceBySlugQuery, GetInstanceBySlugResult } from "./types";

// Público de propósito — é a tela de convite (/testes/d/:slug): ninguém precisa estar logado para
// ver "você foi convidado a fazer o teste".
export async function getInstanceBySlugHandler(query: GetInstanceBySlugQuery): Promise<GetInstanceBySlugResult> {
  return getInstanceBySlug(query);
}
