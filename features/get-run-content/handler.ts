import { getRunContent } from "./service";
import type { GetRunContentQuery, GetRunContentResult } from "./types";

// Público de propósito: é o que a tela do teste precisa para desenhar as perguntas (sem gabarito).
// Quem pode ou não responder (login, aplicação encerrada…) é decidido na tela e no envio.
export async function getRunContentHandler(query: GetRunContentQuery): Promise<GetRunContentResult> {
  return getRunContent(query);
}
