import type { ComponentType } from "react";
import type { TestResultView } from "../../contracts/types";
import type { RunnerContent } from "../content/types";

// PARTE DE TELA DO MÓDULO. Duas peças registradas à parte (runner-registry.ts e report-registry.ts)
// porque o runner é componente client (vai para o bundle do navegador) e o relatório é componente
// de servidor — juntar os dois num registro só levaria TODOS os relatórios para o navegador.

// Props do runner: só a UI das perguntas. A plataforma (ModuleRunnerHost) cuida de enviar,
// mostrar "calculando", tratar erro, navegar para o resultado e (fase 3) guardar/retomar o
// progresso. O runner chama onSubmit(answers) UMA vez, quando o teste termina.
export type ModuleRunnerProps = {
  // Contexto/ambiente em que o participante deve pensar ao responder. Aparece no enunciado.
  contextLabel: string;
  onSubmit: (answers: unknown) => void;
  // Erro do último envio (resposta rejeitada, falha de rede…); o runner decide onde mostrar.
  error: string | null;
  // Progresso salvo (devolvido por onProgress numa visita anterior), para retomar de onde parou.
  // Vem do sessionStorage do navegador: trate como NÃO CONFIÁVEL e valide o formato antes de usar.
  initialState?: unknown;
  // O runner chama a cada passo com o estado serializável (JSON) que precisa para retomar. A
  // plataforma guarda e apaga ao enviar com sucesso.
  onProgress?: (state: unknown) => void;
  // Módulos "authored": as perguntas (versão publicada, SEM gabarito) que o runner desenha. Nulo nos
  // módulos de conteúdo fixo (DISC).
  content?: RunnerContent | null;
  // Testes com tempo limite: quando expira (hora do SERVIDOR) e a hora do servidor ao iniciar, para o
  // cronômetro não depender do relógio do computador. O servidor confere o prazo de novo no envio.
  timer?: { expiresAt: string; serverNow: string } | null;
};

// Props do relatório: o resultado já carregado e autorizado pela plataforma.
export type ModuleReportProps = {
  result: TestResultView;
  // Texto do rodapé do relatório (configurável no admin; vazio = sem rodapé). A plataforma entrega;
  // o módulo só desenha.
  footerText: string;
};

// Componente client com as perguntas.
export type ModuleRunnerComponent = ComponentType<ModuleRunnerProps>;

// Folha do relatório (digital + impressão). A plataforma coloca a barra de ações, o aviso de login e
// o isolamento de impressão em volta; o módulo cuida só da folha.
export type ModuleReportComponent = ComponentType<ModuleReportProps>;
