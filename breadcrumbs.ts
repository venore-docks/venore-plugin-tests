import type { BreadcrumbSegmentDefinition } from "@venore/plugin-sdk";
import { staticBreadcrumbSegment } from "@venore/plugin-sdk";
import { listModules } from "./platform/modules/registry";

// Migalhas das páginas públicas. Uma por módulo registrado (/testes/<id> e /testes/<id>/teste), mais
// as fixas da plataforma. Os apelidos antigos /disc/... redirecionam, então não precisam de migalha.
export const testsBreadcrumbSegments: BreadcrumbSegmentDefinition[] = [
  staticBreadcrumbSegment({ key: "tests.catalog", segments: ["testes"], label: "Testes" }),
  staticBreadcrumbSegment({ key: "tests.my-results", segments: ["testes", "meus-resultados"], label: "Meus resultados" }),
  staticBreadcrumbSegment({ key: "tests.teams", segments: ["testes", "equipes"], label: "Minhas equipes" }),
  ...listModules().flatMap((module) => [
    staticBreadcrumbSegment({ key: `tests.${module.id}`, segments: ["testes", module.id], label: module.name }),
    staticBreadcrumbSegment({ key: `tests.${module.id}.run`, segments: ["testes", module.id, "teste"], label: "Fazer o teste" }),
  ]),
];
