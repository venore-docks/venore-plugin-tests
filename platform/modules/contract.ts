// CONTRATO DE MÓDULO DE TESTE — o que um módulo (DISC, Big Five, Conhecimentos, Clima…) precisa
// implementar para entrar no plugin Testes. Regras completas em docs/modulos.md; o teste
// platform/modules/contract.test.ts confere cada módulo registrado contra este contrato.
//
import type { IdentityMode } from "../../contracts/types";
import type { AuthoringSpec, QuestionSetContent } from "../content/types";

// Este arquivo é a parte SERVIDOR/dados do módulo (sem React). A parte de tela (runner, relatório)
// está em ui-contract.ts, registrada à parte em ui-registry.tsx.

export type ModuleError = { code: string; message: string };

// Contexto que a plataforma entrega a validateAnswers/score. Módulo "static": content = null. Módulo
// "authored": content = a versão PUBLICADA do conjunto de perguntas usada nesta resposta (o módulo
// pontua contra ela, nunca contra o rascunho).
export type ScoreContext = {
  content: QuestionSetContent | null;
  // Só em testes com tempo limite: a plataforma mede (no servidor) e informa.
  elapsedSeconds?: number | null;
  timeLimitSeconds?: number | null;
};

// Origem e licença da pontuação são OBRIGATÓRIAS (regra 9): não entra módulo cuja fórmula ou banco
// de perguntas não tenha dono e licença registrados. Quem cria o módulo responde pela validade.
export type ModuleSource = {
  author: string;
  license: string;
  // Link, citação ou nota de onde veio a fórmula/o banco de perguntas.
  reference?: string;
};

// O que a pontuação devolve. `dataset` é gravado verbatim (formato próprio do módulo, versionado
// por `version`); headline/headlineSecondary são o resumo curto que listas e painéis mostram.
export type ScoreOutcome = {
  dataset: unknown;
  headline: string;
  headlineSecondary?: string | null;
};

export type ModuleHelp = {
  title: string;
  // HTML confiável (vem do código do módulo, nunca de usuário).
  html: string;
};

export interface TestModule {
  // kebab-case, único, estável (vai na URL e no banco) e fora da lista de ids reservados.
  id: string;
  name: string;
  description: string;
  // Duração estimada mostrada antes do teste.
  estimatedMinutes: number;
  // Versão do banco de perguntas + fórmula. Gravada em cada resultado: um relatório antigo
  // continua legível quando o módulo muda. Qualquer mudança que altere um número sobe a versão.
  version: string;
  source: ModuleSource;
  // "static": perguntas no código do módulo. "authored": quem usa cria as perguntas (precisa da
  // tela de edição de perguntas da plataforma).
  contentKind: "static" | "authored";
  // Valor quando o administrador ainda não ligou/desligou o módulo. DISC: true; módulos novos:
  // false (só aparecem depois que um administrador ligar).
  defaultEnabled: boolean;
  help: ModuleHelp;
  // "Como ler este relatório": explica ao participante o que cada parte do resultado significa.
  // Aparece recolhido acima do relatório (só na tela). Opcional, mas recomendado.
  howToRead?: ModuleHelp;
  // Obrigatório quando contentKind = "authored": como o editor do admin monta e valida o conteúdo.
  authoring?: AuthoringSpec;
  // Modo de identificação sugerido ao criar uma aplicação deste teste (padrão da plataforma:
  // "identified" em equipe). Pesquisa de clima usa "anonymous".
  defaultIdentityMode?: IdentityMode;
  // Quem responde vê o próprio resultado ao final por padrão? (padrão: true). Clima/vaga: false.
  defaultShowResultToParticipant?: boolean;
  // Resultados individuais ficam ocultos: o líder só vê o agregado, e só depois de N respostas
  // (clima). Vale para aplicações em modo "anonymous".
  aggregateOnly?: boolean;
  // Confere o formato e a completude das respostas ANTES de pontuar (nunca confie no navegador).
  validateAnswers(answers: unknown, context: ScoreContext): ModuleError | null;
  // Pontuação — só roda no servidor. Entrada já validada.
  score(answers: unknown, context: ScoreContext): ScoreOutcome;
  // Texto curto de um resultado para listas ("Persistente (Sc)"). Opcional: sem isto a lista mostra
  // o headline cru.
  describeHeadline?(headline: string, headlineSecondary: string | null): string;
}

// Ids que a plataforma usa em URLs (`/testes/<id>`): nenhum módulo pode ter um deles.
export const RESERVED_MODULE_IDS = ["r", "d", "meus-resultados", "equipes", "concluido", "admin", "api"] as const;

const MODULE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isValidModuleId(id: string): boolean {
  return MODULE_ID_PATTERN.test(id) && !(RESERVED_MODULE_IDS as readonly string[]).includes(id);
}
