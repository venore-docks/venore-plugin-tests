import { BigFiveReportSheet } from "../../modules/bigfive/report/report-sheet";
import { ClimateReportSheet } from "../../modules/clima/report/report-sheet";
import { KnowledgeReportSheet } from "../../modules/conhecimentos/report/report-sheet";
import { DiscReportSheet } from "../../modules/disc/report/report-sheet";
import type { ModuleReportComponent } from "./ui-contract";

// Folhas de relatório (componentes de servidor) por id de módulo. Todo id de registry.ts precisa ter
// entrada aqui (conferido em contract.test.ts).
const REPORTS: Readonly<Record<string, ModuleReportComponent>> = {
  disc: DiscReportSheet,
  "big-five": BigFiveReportSheet,
  conhecimentos: KnowledgeReportSheet,
  clima: ClimateReportSheet,
};

export function getModuleReport(moduleId: string): ModuleReportComponent | undefined {
  return REPORTS[moduleId];
}

export function listReportIds(): string[] {
  return Object.keys(REPORTS);
}
