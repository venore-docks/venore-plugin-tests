import type { ModuleReportProps } from "../../../platform/modules/ui-contract";

// Pesquisa de clima é anônima e só tem resultado AGREGADO (visto por quem aplicou, na página da
// aplicação). Quem respondeu não tem relatório individual — esta folha existe só porque o contrato
// exige uma e cobre o caso de alguém abrir o link de uma resposta.
export function ClimateReportSheet({ result }: ModuleReportProps) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-2 rounded-panel border border-border bg-card p-8 text-center">
      <h1 className="text-xl font-semibold">Resposta registrada</h1>
      <p className="text-sm text-muted-foreground">
        Obrigado por participar{result.contextLabel ? ` (${result.contextLabel})` : ""}. Esta pesquisa é anônima: os resultados aparecem somados para o grupo, nunca por pessoa.
      </p>
    </section>
  );
}
