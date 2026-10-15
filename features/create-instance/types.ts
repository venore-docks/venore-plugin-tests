import type { OperationResult } from "@venore/plugin-sdk";
import type { IdentityMode, TestInstanceRecord } from "../../contracts/types";

export type CreateInstanceCommand = {
  testId: string;
  teamId?: string | null;
  // Rótulo da aplicação ("1º trimestre 2026") — distingue instâncias da mesma equipe.
  title?: string | null;
  // Contexto/ambiente em que as respostas devem ser pensadas.
  contextLabel: string;
  // Módulos "authored": qual conjunto de perguntas publicado usar. Omitido = o padrão do módulo. A
  // aplicação FIXA a versão publicada no momento da criação.
  questionSetId?: string | null;
  // Padrão: equipe → "identified"; pessoal logada → "login"; criada por plugin consumidor → "identified".
  identityMode?: IdentityMode;
  // Padrão: true. Plugin de vagas passa false (o candidato não vê; o RH vê).
  showResultToParticipant?: boolean;
  // Nulo quando o ator é um plugin consumidor sem sessão (ex: candidatura em vagas); instância de
  // equipe sempre exige ator autenticado que seja admin da equipe (validado em service.ts).
  actorId: string | null;
  // Só para chamadas de plugin consumidor — o fluxo de UI nunca preenche.
  redirectUrl?: string | null;
  externalRef?: string | null;
};
export type CreateInstanceInput = Omit<CreateInstanceCommand, "actorId" | "redirectUrl" | "externalRef">;
export type CreateInstanceResult = OperationResult<TestInstanceRecord>;
