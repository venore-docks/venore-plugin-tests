import { asPluginPage, type PluginRouteTable } from "@venore/plugin-sdk";
import AdminContentEditorPage from "./admin-content/editor-page";
import AdminContentListPage from "./admin-content/list-page";
import AdminModulesPage from "./admin-modules/page";
import CatalogPage from "./catalog/page";
import CompareInstancesPage from "./compare/page";
import TestDonePage from "./done/page";
import InstanceResultsPage from "./instance-results/page";
import InvitePage from "./invite/page";
import {
  DiscAliasInstance,
  DiscAliasInvite,
  DiscAliasLanding,
  DiscAliasMyResults,
  DiscAliasReport,
  DiscAliasRun,
  DiscAliasTeam,
  DiscAliasTeams,
} from "./legacy-aliases/pages";
import ModuleLandingPage from "./module-landing/page";
import MyResultsPage from "./my-results/page";
import TestResultPage from "./report/page";
import RunTestPage from "./run/page";
import TeamDetailPage from "./team-detail/page";
import TeamsPage from "./teams/page";

// Todas as rotas públicas são renderizadas com a shell normal do tema (catch-all do CMS), mesmo as
// que exigem login — auth() é checado dentro de cada page.tsx (mesmo padrão da academy). As rotas
// admin são /admin/tests (ligar/desligar módulos, tests.modules.manage) e /admin/tests/conteudo/...
// (editar o conteúdo dos testes, tests.content.manage).
//
// ORDEM IMPORTA (primeiro padrão que casa vence): os caminhos fixos de /testes (r, d, equipes,
// meus-resultados, concluido) vêm ANTES de /testes/:moduleId — por isso esses nomes são ids de
// módulo reservados (platform/modules/contract.ts → RESERVED_MODULE_IDS).
export const testsRouteTable: PluginRouteTable = {
  admin: [
    { pattern: "", Component: asPluginPage(AdminModulesPage) },
    { pattern: "conteudo/:moduleId", Component: asPluginPage(AdminContentListPage) },
    { pattern: "conteudo/:moduleId/:setId", Component: asPluginPage(AdminContentEditorPage) },
  ],
  public: [
    { pattern: "testes", Component: asPluginPage(CatalogPage) },
    { pattern: "testes/meus-resultados", Component: asPluginPage(MyResultsPage) },
    { pattern: "testes/concluido", Component: asPluginPage(TestDonePage) },
    { pattern: "testes/r/:resultId", Component: asPluginPage(TestResultPage) },
    { pattern: "testes/d/:slug", Component: asPluginPage(InvitePage) },
    { pattern: "testes/equipes", Component: asPluginPage(TeamsPage) },
    { pattern: "testes/equipes/:teamId", Component: asPluginPage(TeamDetailPage) },
    // "comparar" ANTES de :instanceId, senão seria lido como id de aplicação.
    { pattern: "testes/equipes/:teamId/comparar", Component: asPluginPage(CompareInstancesPage) },
    { pattern: "testes/equipes/:teamId/:instanceId", Component: asPluginPage(InstanceResultsPage) },
    { pattern: "testes/:moduleId", Component: asPluginPage(ModuleLandingPage) },
    { pattern: "testes/:moduleId/teste", Component: asPluginPage(RunTestPage) },

    // Apelidos permanentes das URLs do antigo plugin DISC — ver routes/legacy-aliases/pages.tsx.
    { pattern: "disc", Component: asPluginPage(DiscAliasLanding) },
    { pattern: "disc/teste", Component: asPluginPage(DiscAliasRun) },
    { pattern: "disc/r/:reportId", Component: asPluginPage(DiscAliasReport) },
    { pattern: "disc/d/:slug", Component: asPluginPage(DiscAliasInvite) },
    { pattern: "disc/meus-resultados", Component: asPluginPage(DiscAliasMyResults) },
    { pattern: "disc/equipes", Component: asPluginPage(DiscAliasTeams) },
    { pattern: "disc/equipes/:teamId", Component: asPluginPage(DiscAliasTeam) },
    { pattern: "disc/equipes/:teamId/:instanceId", Component: asPluginPage(DiscAliasInstance) },
  ],
};
