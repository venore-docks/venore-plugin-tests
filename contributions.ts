import type { PluginContributions } from "@venore/plugin-sdk";
import { testsBreadcrumbSegments } from "./breadcrumbs";

// userNavItems/publicHomeShowcase usam componente que sobe até auth/ui, então import()
// preguiçoso — mesmo padrão de venore-plugin-academy/contributions.ts.
export const testsContributions: PluginContributions = {
  breadcrumbSegments: testsBreadcrumbSegments,
  userNavItems: async () => [
    { key: "tests.my-results", label: "Meus resultados", href: "/testes/meus-resultados", icon: "clipboard-list" },
    { key: "tests.teams", label: "Minhas equipes", href: "/testes/equipes", icon: "users" },
  ],
  publicHomeShowcase: async () => {
    const { renderTestsPublicHomeShowcase } = await import("./content-slots/public-home-showcase");
    return renderTestsPublicHomeShowcase();
  },
};
