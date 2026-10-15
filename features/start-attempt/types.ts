import type { OperationResult } from "@venore/plugin-sdk";
import type { ContentRef } from "../../platform/content/types";

export type StartAttemptCommand = {
  moduleId: string;
  instanceId: string | null;
  // Conteúdo que a tela carregou (aplicação: conferido contra o fixado na aplicação).
  contentRef: ContentRef;
  // Retomada (recarregou a página): devolve o relógio da MESMA tentativa em vez de abrir outra —
  // senão recarregar reiniciaria o cronômetro.
  existingAttemptId?: string | null;
  actorId: string | null;
};
export type StartAttemptInput = Omit<StartAttemptCommand, "actorId">;

export type AttemptClock = {
  attemptId: string;
  // ISO — hora do SERVIDOR (o cronômetro da tela usa a diferença, não o relógio do computador).
  expiresAt: string;
  serverNow: string;
};

export type StartAttemptResult = OperationResult<AttemptClock | null>;
