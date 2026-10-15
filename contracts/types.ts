// Tipos de domínio e de API pública do plugin Testes. Nada aqui depende de um módulo específico
// (DISC, Big Five…): o que é próprio de cada teste vive em `dataset` (opaco) e em modules/<id>/.

export type IdentityMode = "identified" | "login" | "anonymous";

export type TestTeamRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type TestTeamMemberRole = "admin" | "member";

export type TestTeamMemberRecord = {
  id: string;
  teamId: string;
  userId: string;
  role: TestTeamMemberRole;
  createdAt: Date;
};

export type TestInstanceRecord = {
  id: string;
  testId: string;
  teamId: string | null;
  title: string | null;
  contextLabel: string;
  shareSlug: string;
  createdByUserId: string | null;
  redirectUrl: string | null;
  externalRef: string | null;
  identityMode: IdentityMode;
  showResultToParticipant: boolean;
  closedAt: Date | null;
  // Módulos authored: conteúdo fixado na criação da aplicação.
  questionSetId: string | null;
  questionSetVersion: number | null;
  createdAt: Date;
};

export type TestResultRecord = {
  id: string;
  testId: string;
  testVersion: string;
  userId: string | null;
  instanceId: string | null;
  contextLabel: string;
  participantName: string | null;
  participantEmail: string | null;
  participantEmailKey: string | null;
  dataset: unknown;
  headline: string;
  headlineSecondary: string | null;
  unclaimedExpiresAt: Date | null;
  questionSetId: string | null;
  questionSetVersion: number | null;
  createdAt: Date;
};

// Quem respondeu, para o card de identificação do relatório. Só vai preenchido para quem pode ver
// (dono, líder/membros da equipe da instância, quem tem permissão no consumidor).
export type TestResultIdentity = {
  name: string | null;
  email: string | null;
  teamName: string | null;
  instanceTitle: string | null;
};

// O que o relatório de um módulo recebe. `dataset` é opaco para a plataforma: o módulo que o gerou
// (testId + moduleVersion) sabe interpretar.
export type TestResultView = {
  id: string;
  testId: string;
  moduleVersion: string;
  contextLabel: string;
  dataset: unknown;
  headline: string;
  headlineSecondary: string | null;
  createdAt: Date;
  isClaimed: boolean;
  identity: TestResultIdentity | null;
  // Conteúdo em que foi respondido (módulos authored).
  questionSetId: string | null;
  questionSetVersion: number | null;
};
