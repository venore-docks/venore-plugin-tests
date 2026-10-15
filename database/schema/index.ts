import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgSchema, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const testsSchema = pgSchema("tests");

// createdByUserId/ownerUserId/userId são texto solto, sem FK pra auth.users: um plugin não pode
// importar contexts/auth/database/schema (regra de isolamento de schema entre core e plugin — mesmo
// tratamento de birthdays.createdByUserId). Usuário apagado deixa o id órfão aqui.

// Quais módulos de teste (DISC, Big Five…) estão LIGADOS. Sem linha = vale o `defaultEnabled` do
// módulo (platform/modules/activation.ts). Desligar não apaga nada: só impede criar instância e
// iniciar teste novo — resultados já gravados continuam legíveis.
export const testModuleSettings = testsSchema.table("module_settings", {
  moduleId: text("module_id").primaryKey(),
  enabled: boolean("enabled").notNull(),
  updatedByUserId: text("updated_by_user_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// CONTEÚDO EDITÁVEL (módulos "authored": Big Five, Conhecimentos, Clima…).
// Um CONJUNTO de perguntas tem um RASCUNHO (sempre editável) e VERSÕES publicadas (imutáveis).
// Aplicações e resultados apontam para (conjunto, versão): editar o rascunho ou publicar uma versão
// nova nunca muda o que já foi aplicado ou respondido.
export const testQuestionSets = testsSchema.table(
  "question_sets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    moduleId: text("module_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    // QuestionSetContent (platform/content/types.ts) em edição.
    draft: jsonb("draft").notNull(),
    // Última versão publicada (nulo = nunca publicado). Só conjunto publicado pode ser usado.
    publishedVersion: integer("published_version"),
    // Conjunto padrão do módulo: usado no teste avulso e quando a aplicação não escolhe um.
    isDefault: boolean("is_default").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdByUserId: text("created_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("question_sets_module_idx").on(table.moduleId),
    // No máximo UM padrão por módulo.
    uniqueIndex("question_sets_default_unique")
      .on(table.moduleId)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const testQuestionSetVersions = testsSchema.table(
  "question_set_versions",
  {
    setId: text("set_id")
      .notNull()
      .references(() => testQuestionSets.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    // Título no momento da publicação (o conjunto pode ser renomeado depois).
    title: text("title").notNull(),
    content: jsonb("content").notNull(),
    publishedByUserId: text("published_by_user_id"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.setId, table.version] })],
);

export const testTeams = testsSchema.table("teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerUserId: text("owner_user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const testTeamMembers = testsSchema.table("team_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("team_id")
    .notNull()
    .references(() => testTeams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  // "admin" | "member" — só controla o que a UI do time mostra (convidar, encerrar instância);
  // não é uma RBAC permission do core, é um dado de domínio do plugin.
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Uma instância = "aplique o teste <testId> para [contexto]" com um link curto de convite.
//  - teamId nulo: instância pessoal ou criada por outro plugin (ex: candidatura em vagas).
//  - A mesma equipe pode ter várias instâncias (ex: 1º e 2º trimestre) — cada uma é um conjunto
//    novo de respostas; quem já respondeu uma instância não responde de novo, mas pode responder a
//    seguinte.
//  - externalRef (ex: "vagas:<candidaturaId>") é ÚNICO: criar duas vezes com a mesma referência
//    devolve a instância que já existe (idempotência pra quem consome o plugin).
export const testInstances = testsSchema.table(
  "instances",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    testId: text("test_id").notNull().default("disc"),
    teamId: text("team_id").references(() => testTeams.id, { onDelete: "cascade" }),
    // Rótulo livre da aplicação ("1º trimestre 2026") — distingue instâncias da mesma equipe.
    title: text("title"),
    // Contexto/ambiente em que as respostas devem ser pensadas ("no trabalho", "no time de vendas").
    contextLabel: text("context_label").notNull().default("Geral"),
    shareSlug: text("share_slug").notNull().unique(),
    createdByUserId: text("created_by_user_id"),
    // Pra onde mandar quem respondeu depois de enviar (plugin consumidor). Nulo = relatório padrão.
    redirectUrl: text("redirect_url"),
    externalRef: text("external_ref"),
    // "identified": responde SEM login informando nome e e-mail (equipe, vaga);
    // "login": exige conta; "anonymous": não coleta identidade (pesquisa de clima).
    identityMode: text("identity_mode").notNull().default("identified"),
    // Quem responde sem login vê o próprio resultado ao final? Equipe = sim; vaga = não.
    showResultToParticipant: boolean("show_result_to_participant").notNull().default(true),
    // Link desativado (nenhuma resposta nova). Resultados existentes continuam.
    closedAt: timestamp("closed_at", { withTimezone: true }),
    // Módulos "authored": o conjunto de perguntas e a VERSÃO fixados na criação da aplicação (editar
    // ou publicar depois não muda esta aplicação). Nulo em módulos de conteúdo fixo (DISC).
    questionSetId: text("question_set_id").references(() => testQuestionSets.id, { onDelete: "restrict" }),
    questionSetVersion: integer("question_set_version"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("instances_external_ref_unique").on(table.externalRef).where(sql`${table.externalRef} is not null`),
    index("instances_team_idx").on(table.teamId),
  ],
);

// Uma resposta COMPLETA a um teste. Existe sozinha (teste avulso, logado) ou presa a uma
// instância. `dataset` é a saída verbatim da pontuação do módulo (formato próprio de cada módulo,
// versionado por testVersion); headline/headlineSecondary são o resumo curto que as listas
// mostram (DISC: perfil externo/interno; outros módulos: nota, faixa…).
export const testResults = testsSchema.table(
  "results",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    testId: text("test_id").notNull(),
    testVersion: text("test_version").notNull(),
    userId: text("user_id"),
    instanceId: text("instance_id").references(() => testInstances.id, { onDelete: "cascade" }),
    contextLabel: text("context_label").notNull(),
    // Identidade de quem respondeu SEM login (nome e e-mail do convite). Com login, vem da conta.
    participantName: text("participant_name"),
    participantEmail: text("participant_email"),
    // E-mail normalizado (minúsculo, sem espaços) — chave do bloqueio "uma resposta por pessoa por
    // instância" e do casamento da mesma pessoa entre instâncias.
    participantEmailKey: text("participant_email_key"),
    dataset: jsonb("dataset").notNull(),
    headline: text("headline").notNull(),
    headlineSecondary: text("headline_secondary"),
    // Resposta avulsa ainda sem dono (aguardando login): apagada depois desta data se ninguém a
    // reivindicar. Nulo = não expira.
    unclaimedExpiresAt: timestamp("unclaimed_expires_at", { withTimezone: true }),
    // Conteúdo (conjunto + versão) em que foi respondido — sem FK de propósito: o histórico precisa
    // sobreviver mesmo se o conjunto for arquivado.
    questionSetId: text("question_set_id"),
    questionSetVersion: integer("question_set_version"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("results_instance_participant_unique")
      .on(table.instanceId, table.participantEmailKey)
      .where(sql`${table.instanceId} is not null and ${table.participantEmailKey} is not null`),
    index("results_user_idx").on(table.userId),
    index("results_instance_idx").on(table.instanceId),
  ],
);

// Início de uma resposta COM TEMPO LIMITE (ex.: Conhecimentos). O servidor guarda quando começou e
// quando expira — o relógio do navegador não vale. Sem tempo limite não há tentativa registrada.
export const testAttempts = testsSchema.table(
  "attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    moduleId: text("module_id").notNull(),
    instanceId: text("instance_id").references(() => testInstances.id, { onDelete: "cascade" }),
    questionSetId: text("question_set_id").notNull(),
    questionSetVersion: integer("question_set_version").notNull(),
    userId: text("user_id"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [index("attempts_instance_idx").on(table.instanceId)],
);
