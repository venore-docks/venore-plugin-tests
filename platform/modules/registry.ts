import { bigFiveModule } from "../../modules/bigfive";
import { climateModule } from "../../modules/clima";
import { knowledgeModule } from "../../modules/conhecimentos";
import { discModule } from "../../modules/disc";
import type { TestModule } from "./contract";

// Registro ESTÁTICO dos módulos instalados. Para adicionar um módulo: criar modules/<id>/ seguindo
// docs/modulos.md e listá-lo aqui (e em runner-registry.ts e report-registry.ts). O teste
// contract.test.ts reprova módulo que descumpre o contrato.
const MODULES: readonly TestModule[] = [discModule, bigFiveModule, knowledgeModule, climateModule];

export function listModules(): readonly TestModule[] {
  return MODULES;
}

export function getModule(moduleId: string): TestModule | undefined {
  return MODULES.find((module) => module.id === moduleId);
}
