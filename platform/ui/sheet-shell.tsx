import type { ReactNode } from "react";
import { cn } from "@venore/plugin-sdk/ui";
import type { TestResultView } from "../../contracts/types";

// Invólucro de relatório para módulos novos (Big Five, Conhecimentos, Clima…): cabeçalho com o nome
// do teste, quem respondeu, o contexto e a data, o corpo do módulo e um rodapé — e impressão em A4
// de papel branco (tokens neutros fixos no papel, margens de 12mm, sem quebrar o cartão no meio).
// O isolamento do site na impressão é da plataforma (print-portal.tsx). O relatório DISC NÃO usa
// isto: ele tem o layout próprio do NestPro.

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  .tests-sheet {
    --background: #fff; --foreground: #111827; --card: #fff; --card-foreground: #111827;
    --muted: #f3f4f6; --muted-foreground: #4b5563; --border: #d1d5db;
    --primary: #1f2a5a; --primary-foreground: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    background: #fff; color: #111827;
  }
  .tests-sheet .avoid-break { break-inside: avoid; }
}
`;

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function SheetShell({
  moduleName,
  result,
  demoNotice,
  footerText,
  children,
  className,
}: {
  moduleName: string;
  result: TestResultView;
  // Aviso de "conteúdo de demonstração" (ex.: itens de exemplo, não validados).
  demoNotice?: string | null;
  // Rodapé do relatório (configurável no admin; vazio/ausente = sem rodapé).
  footerText?: string;
  children: ReactNode;
  className?: string;
}) {
  const identity = result.identity;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <article className={cn("tests-sheet flex flex-col gap-6 rounded-panel border border-border bg-card p-6 text-card-foreground print:border-0 print:p-0", className)}>
        <header className="avoid-break flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{moduleName}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{identity?.name ?? "Resultado"}</h1>
            {identity?.email && <p className="text-sm text-muted-foreground">{identity.email}</p>}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Data</dt>
            <dd>{formatDate(result.createdAt)}</dd>
            <dt className="text-muted-foreground">Contexto</dt>
            <dd>{result.contextLabel}</dd>
            {identity?.teamName && (
              <>
                <dt className="text-muted-foreground">Equipe</dt>
                <dd>{identity.teamName}</dd>
              </>
            )}
            {identity?.instanceTitle && (
              <>
                <dt className="text-muted-foreground">Aplicação</dt>
                <dd>{identity.instanceTitle}</dd>
              </>
            )}
          </dl>
        </header>

        {demoNotice && <p className="avoid-break rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground">{demoNotice}</p>}

        {children}

        {footerText && <footer className="avoid-break mt-2 border-t border-border pt-3 text-center text-sm text-muted-foreground">{footerText}</footer>}
      </article>
    </>
  );
}
