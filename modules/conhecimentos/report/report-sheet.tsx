import { cn } from "@venore/plugin-sdk/ui";
import { SheetShell } from "../../../platform/ui/sheet-shell";
import type { ModuleReportProps } from "../../../platform/modules/ui-contract";
import { KNOWLEDGE_DEMO_NOTICE } from "../content";
import type { KnowledgeDataset } from "../score";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} min ${String(rest).padStart(2, "0")} s`;
}

// Relatório do teste de conhecimentos: nota, situação (aprovado/reprovado pela nota de corte),
// aviso de envio fora do prazo e, questão a questão, o que foi marcado × o gabarito.
export function KnowledgeReportSheet({ result, footerText }: ModuleReportProps) {
  const data = result.dataset as KnowledgeDataset;

  return (
    <SheetShell footerText={footerText} moduleName="Teste de conhecimentos" result={result} demoNotice={data.demo ? KNOWLEDGE_DEMO_NOTICE : null}>
      <section className="avoid-break grid gap-4 sm:grid-cols-3 print:grid-cols-3">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Nota</p>
          <p className="text-4xl font-semibold tabular-nums">{data.percent}%</p>
          <p className="text-sm text-muted-foreground">
            {data.earned} de {data.max} pontos
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Situação</p>
          <p className={cn("text-2xl font-semibold", data.passed ? "text-success" : "text-destructive")}>{data.passed ? "Aprovado" : "Reprovado"}</p>
          <p className="text-sm text-muted-foreground">Nota de corte: {data.passScore}%</p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Acertos</p>
          <p className="text-2xl font-semibold tabular-nums">
            {data.correctCount}/{data.questionCount}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.elapsedSeconds !== null ? `Tempo: ${formatDuration(data.elapsedSeconds)}` : "Sem tempo limite"}
            {data.timeLimitMinutes > 0 ? ` (limite ${data.timeLimitMinutes} min)` : ""}
          </p>
        </div>
      </section>

      {data.late && (
        <p className="avoid-break rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
          Esta resposta foi enviada <strong>depois do tempo limite</strong>. A nota está calculada com tudo o que foi enviado — cabe a quem aplicou o teste decidir como tratá-la.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Respostas</h2>
        {data.items.map((item, index) => (
          <div key={item.id} className="avoid-break rounded-md border border-border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {index + 1}. {item.text}
              </p>
              <span className={cn("shrink-0 text-xs font-medium", item.correct ? "text-success" : "text-destructive")}>
                {item.correct ? "Certa" : item.answered ? "Errada" : "Sem resposta"} · {item.earned}/{item.points}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">Marcada: {item.chosen.length ? item.chosen.join("; ") : "—"}</p>
            {!item.correct && <p className="text-muted-foreground">Correta: {item.right.join("; ")}</p>}
            {item.explanation && <p className="mt-1 text-xs text-muted-foreground">{item.explanation}</p>}
          </div>
        ))}
      </section>
    </SheetShell>
  );
}
