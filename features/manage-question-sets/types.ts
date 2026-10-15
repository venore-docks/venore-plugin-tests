import type { OperationResult } from "@venore/plugin-sdk";
import type { ModuleError } from "../../platform/modules/contract";
import type { QuestionSetContent } from "../../platform/content/types";

export type QuestionSetSummary = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  publishedVersion: number | null;
  // O rascunho tem alterações que ainda não viraram versão publicada.
  hasUnpublishedChanges: boolean;
  isDefault: boolean;
  archived: boolean;
  questionCount: number;
  instanceCount: number;
  updatedAt: Date;
};

export type QuestionSetDetail = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  publishedVersion: number | null;
  hasUnpublishedChanges: boolean;
  isDefault: boolean;
  archived: boolean;
  draft: QuestionSetContent;
  versions: Array<{ version: number; title: string; publishedAt: Date }>;
  instanceCount: number;
  resultCount: number;
  // O que falta para poder publicar o rascunho de hoje (vazio = pode publicar).
  publishProblems: ModuleError[];
};

export type ListQuestionSetsResult = OperationResult<QuestionSetSummary[]>;
export type GetQuestionSetResult = OperationResult<QuestionSetDetail>;

export type CreateQuestionSetInput = { moduleId: string; title: string; description?: string | null };
export type CreateQuestionSetResult = OperationResult<{ id: string }>;

export type SaveDraftInput = { setId: string; title: string; description?: string | null; content: unknown };
export type SaveDraftResult = OperationResult<{ publishProblems: ModuleError[]; hasUnpublishedChanges: boolean }>;

export type PublishInput = { setId: string };
export type PublishResult = OperationResult<{ version: number }>;

export type SetDefaultInput = { setId: string };
export type SetDefaultResult = OperationResult<{ setId: string }>;

export type DuplicateInput = { setId: string };
export type DuplicateResult = OperationResult<{ id: string }>;

export type DeleteInput = { setId: string };
// "deleted": ninguém usava e foi apagado. "archived": havia aplicação ou resposta — some das
// listas e não pode mais ser escolhido, mas o histórico continua legível.
export type DeleteResult = OperationResult<{ action: "deleted" | "archived" }>;

export type CreateStarterInput = { moduleId: string };
export type CreateStarterResult = OperationResult<{ id: string; created: boolean }>;
