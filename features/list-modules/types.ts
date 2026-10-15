import type { OperationResult } from "@venore/plugin-sdk";
import type { ModuleSource } from "../../platform/modules/contract";

export type ModuleSummary = {
  id: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  version: string;
  contentKind: "static" | "authored";
  source: ModuleSource;
  enabled: boolean;
  defaultEnabled: boolean;
  // Pode ser usado de verdade: módulos de conteúdo fixo sempre; os de conteúdo editável só quando há
  // um conjunto de perguntas PADRÃO publicado. Módulo ligado mas sem conteúdo não aparece no catálogo.
  hasContent: boolean;
};

export type ListModulesResult = OperationResult<ModuleSummary[]>;
