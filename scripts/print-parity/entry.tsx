// Página de teste da regressão de impressão: o relatório DISC embutido (TestResultReport) dentro de
// uma "casca de site" falsa em modo escuro — a impressão tem que ignorar a casca e o tema. Os dados
// são os do PDF de referência (modules/disc/report/__fixtures__/exemplo-relatorio-disc.pdf).
import { createRoot } from "react-dom/client";
import { TestResultReport } from "../../platform/report/test-result-report";
import type { TestResultView } from "../../contracts/types";

const result: TestResultView = {
  id: "parity",
  testId: "disc",
  moduleVersion: "1.0.0",
  contextLabel: "Comercial",
  isClaimed: true,
  createdAt: new Date("2026-04-14T19:42:00Z"),
  identity: { name: "Adoniran de Souza Bail", email: "adoniransbayerl@gmail.com", teamName: "Melhor equipe FEM", instanceTitle: null },
  headline: "sc",
  headlineSecondary: "sdi",
  dataset: {
    more: { profile: "sc", percentual: { d: 38, i: 45, s: 60, c: 60 } },
    less: { profile: "sdi", percentual: { d: 67, i: 60, s: 73, c: 60 } },
    stress: 57,
  },
};

document.documentElement.classList.add("dark");
createRoot(document.getElementById("root")!).render(
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b p-6">SHELL HEADER — não deve sair na impressão</header>
    <main className="mx-auto max-w-6xl px-4 py-8">
      <TestResultReport result={result} />
    </main>
    <footer className="p-10">SHELL FOOTER — não deve sair na impressão</footer>
  </div>,
);
