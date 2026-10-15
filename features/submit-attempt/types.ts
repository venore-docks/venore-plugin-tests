import type { OperationResult } from "@venore/plugin-sdk";
import type { ContentRef } from "../../platform/content/types";
import type { ParticipantInput } from "../../shared/identity";

export type SubmitAttemptCommand = {
  moduleId: string;
  // Respostas brutas do módulo (formato próprio, conferido por module.validateAnswers).
  answers: unknown;
  // Aplicação (link de equipe, vaga). Nulo = teste avulso.
  instanceId?: string | null;
  // Só no teste avulso: a instância define o contexto quando existe.
  contextLabel?: string | null;
  // Nome e e-mail de quem responde SEM login (instância "identified"). Com login, vem da conta.
  participant?: ParticipantInput | null;
  // Módulos "authored": o conteúdo em que a pessoa respondeu. Em aplicação vale SEMPRE o fixado na
  // aplicação (isto é ignorado); no avulso é a versão que a tela carregou.
  contentRef?: ContentRef | null;
  // Testes com tempo limite: a tentativa aberta por start-attempt.
  attemptId?: string | null;
  // Preenchido só pela ação de servidor (lê o cookie do navegador): aplicações anônimas já
  // respondidas NESTE navegador. Nunca vem do cliente.
  deviceAnsweredInstanceIds?: string[];
  actorId: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
};

export type SubmitAttemptInput = Omit<SubmitAttemptCommand, "actorId" | "actorName" | "actorEmail" | "deviceAnsweredInstanceIds">;

export type SubmitAttemptOutcome = {
  id: string;
  // Para onde a plataforma leva o participante depois do envio.
  redirectTo: string;
  // true = o navegador de quem respondeu SEM login ganha acesso temporário a este resultado.
  grantViewAccess: boolean;
  // true = aplicação anônima: o navegador guarda que já respondeu (não dá para garantir por pessoa).
  deviceAnswered: boolean;
};

export type SubmitAttemptResult = OperationResult<SubmitAttemptOutcome>;
