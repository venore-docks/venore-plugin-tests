import { SheetShell } from "../../../platform/ui/sheet-shell";
import type { ModuleReportProps } from "../../../platform/modules/ui-contract";
import { BIG_FIVE_DEMO_NOTICE, BIG_FIVE_TRAITS } from "../content";
import type { BigFiveDataset } from "../score";

function levelOf(percent: number): string {
  if (percent >= 67) return "mais alto";
  if (percent >= 34) return "intermediário";
  return "mais baixo";
}

// Relatório do Big Five: os cinco traços de 0 a 100 (posição dentro da escala de respostas — não é
// nota nem norma), do mais alto para o mais baixo, cada um com o que o traço descreve.
export function BigFiveReportSheet({ result, footerText }: ModuleReportProps) {
  const dataset = result.dataset as BigFiveDataset;
  const ordered = dataset.ranking.map((code) => ({ trait: BIG_FIVE_TRAITS.find((item) => item.code === code)!, score: dataset.traits[code] }));

  return (
    <SheetShell footerText={footerText} moduleName="Big Five (personalidade)" result={result} demoNotice={dataset.demo ? BIG_FIVE_DEMO_NOTICE : null}>
      <section className="flex flex-col gap-5">
        {ordered.map(({ trait, score }) => (
          <div key={trait.code} className="avoid-break flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">{trait.name}</h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                {score.percent}/100 · {levelOf(score.percent)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`${trait.name}: ${score.percent} de 100`}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${score.percent}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">{trait.about}</p>
          </div>
        ))}
      </section>
      <p className="avoid-break text-xs text-muted-foreground">
        Cada traço vai de 0 a 100 e mostra onde as suas respostas ficam dentro da escala — não é uma nota nem uma comparação com outras pessoas. Nenhum traço é melhor
        que outro: eles descrevem tendências no contexto em que você respondeu.
      </p>
    </SheetShell>
  );
}
