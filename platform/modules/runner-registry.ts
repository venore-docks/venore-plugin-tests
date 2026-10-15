import { DiscRunner } from "../../modules/disc/runner/disc-runner";
import { QuestionnaireRunner } from "../run/questionnaire-runner";
import type { ModuleRunnerComponent } from "./ui-contract";

// Runners (componentes client) por id de módulo. Todo id de registry.ts precisa ter entrada aqui
// (conferido em contract.test.ts).
const RUNNERS: Readonly<Record<string, ModuleRunnerComponent>> = {
  disc: DiscRunner,
  // Módulos de conteúdo editável compartilham o runner genérico de questionário.
  "big-five": QuestionnaireRunner,
  conhecimentos: QuestionnaireRunner,
  clima: QuestionnaireRunner,
};

export function getModuleRunner(moduleId: string): ModuleRunnerComponent | undefined {
  return RUNNERS[moduleId];
}

export function listRunnerIds(): string[] {
  return Object.keys(RUNNERS);
}
