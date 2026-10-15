import type { ReactNode } from "react";
import { cn } from "@venore/plugin-sdk/ui";

// Container dos gráficos do relatório. NÃO usa o ChartContainer do SDK de propósito: ele embrulha o
// ResponsiveContainer do recharts, que mede o elemento e injeta width/height — e o navegador não
// refaz essa medição antes de imprimir, então na folha A4 o gráfico saía no tamanho da TELA
// (estourando o card). Aqui o gráfico recebe width/height FIXOS (tamanho intrínseco do desenho) e o
// <svg> escala por CSS (viewBox + width:100%), o que é determinista na tela e no papel — e é
// exatamente o que o original mostrava impresso (desenho de ~600px encolhido pra caber no card).
export function FixedChart({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:h-auto [&_.recharts-surface]:w-full [&_.recharts-surface]:outline-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

type TooltipRow = { name?: string | number; value?: string | number; color?: string };

// Tooltip simples no padrão visual do ChartTooltipContent (que exige o contexto do ChartContainer).
export function PercentTooltip({ active, payload, label, suffix = "%" }: { active?: boolean; payload?: ReadonlyArray<TooltipRow>; label?: string | number; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grid min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      {label !== undefined && <div className="font-medium">{label}</div>}
      {payload.map((row) => (
        <div key={String(row.name)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: row.color }} />
            {row.name}
          </span>
          <span className="font-mono font-medium tabular-nums text-foreground">
            {row.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
