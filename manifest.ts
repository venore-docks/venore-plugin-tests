import type { PluginManifest } from "@venore/plugin-sdk";
import { REPORT_FOOTER_SETTING } from "./shared/report-settings";

// Faixa escrita à mão, não importada de platform/plugin-engine/core-version.ts — mesmo motivo do
// academyManifest e do birthdaysManifest: importar o CORE_VERSION corrente tornaria a checagem de
// compatibilidade sempre trivialmente satisfeita.
//
// Permissão única: tests.modules.manage (ligar/desligar módulos de teste, tela /admin/tests). Fazer
// testes, equipes e aplicações são self-service do usuário — gated por sessão e por papel de equipe
// dentro de cada feature, nunca por RBAC (mesmo espírito das rotas públicas da academy).
export const testsManifest: PluginManifest = {
  manifestVersion: "1.0.0",
  key: "tests",
  name: "Testes",
  version: "0.3.1",
  description:
    "Plataforma de testes em módulos (DISC, Big Five, Conhecimentos, Clima) — aplicação individual ou em equipe, com relatório visual e impressão em A4. Sucessora do plugin DISC / NestPro.",
  compatibility: { coreVersion: ">=2.0.0 <3.0.0" },
  // Schema próprio do plugin — aplicado no install (run-plugin-migrations.ts), não no
  // vercel-build. Default de migrationsSchema ("tests_migrations") bate com drizzle.config.ts.
  migrationsPath: "./migrations",
  permissions: [
    { key: "tests.modules.manage", label: "Ligar e desligar os módulos de teste" },
    { key: "tests.content.manage", label: "Editar o conteúdo dos testes (perguntas, respostas, versões)" },
    { key: "tests.settings.manage", label: "Alterar as configurações do plugin (ex.: texto do rodapé dos relatórios)" },
  ],
  // Configurações editáveis no admin (sistema de settings do core).
  settings: [{ key: REPORT_FOOTER_SETTING.key, defaultValue: REPORT_FOOTER_SETTING.defaultValue }],
  navigation: [
    {
      key: "tests.modules",
      label: "Testes",
      href: "/admin/tests",
      icon: "clipboard-list",
      groupKey: "plugins",
      groupLabel: "Plugins",
      groupOrder: 30,
      order: 20,
      requiredPermission: "tests.modules.manage",
    },
  ],
};
