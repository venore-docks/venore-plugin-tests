import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { AdminAccessDenied, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@venore/plugin-sdk/ui";
import { getTestInstanceAggregate, listTeamTestInstances, listTestInstanceResults } from "../../index";
import { getModule } from "../../platform/modules/registry";
import { AggregateView } from "./aggregate-view";
import { ExportButton } from "./export-button";
import { ReopenButton } from "./reopen-button";

export const dynamic = "force-dynamic";

export default async function InstanceResultsPage({ params }: { params: Promise<{ teamId: string; instanceId: string }> }) {
  const { teamId, instanceId } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/testes/equipes/${teamId}/${instanceId}`)}`);
  }

  const resultsResult = await listTestInstanceResults({ instanceId });
  if (!resultsResult.success) {
    return <AdminAccessDenied message={resultsResult.error.message} />;
  }

  const view = resultsResult.data;
  // Pesquisa anônima: não há lista por pessoa; mostra o agregado por pergunta.
  const aggregateResult = view.individualHidden ? await getTestInstanceAggregate({ instanceId }) : null;
  const moduleName = getModule(view.testId)?.name ?? view.testId;

  // Outras aplicações da mesma equipe e do mesmo teste: candidatas a comparação (ex.: 1º × 2º trimestre).
  const siblingsResult = await listTeamTestInstances({ teamId });
  const siblings = siblingsResult.success ? siblingsResult.data.filter((instance) => instance.id !== instanceId && instance.testId === view.testId) : [];

  // Distribuição dos resultados (quantas pessoas em cada perfil/faixa) — o "retrato" do grupo.
  const distribution = new Map<string, number>();
  for (const result of view.results) {
    distribution.set(result.label, (distribution.get(result.label) ?? 0) + 1);
  }
  const distributionRows = [...distribution.entries()].sort((first, second) => second[1] - first[1]);
  const maxCount = distributionRows[0]?.[1] ?? 1;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{view.title ?? "Resultados"}</h1>
          <p className="text-sm text-muted-foreground">
            {moduleName} · contexto: {view.contextLabel} · {view.total} {view.total === 1 ? "resposta" : "respostas"}
          </p>
        </div>
        {view.results.length > 0 && !view.individualHidden && <ExportButton instanceId={instanceId} />}
      </div>

      {view.individualHidden ? (
        aggregateResult?.success ? <AggregateView aggregate={aggregateResult.data} /> : <AdminAccessDenied message={aggregateResult?.error.message ?? "Resultado indisponível."} />
      ) : view.results.length === 0 ? (
        <EmptyState title="Nenhum resultado ainda" description="Compartilhe o link de teste com a equipe para ver os resultados aqui." />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Retrato do grupo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {distributionRows.map(([label, count]) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className="w-48 shrink-0 truncate">{label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
                  </div>
                  <span className="w-6 text-end tabular-nums text-muted-foreground">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {siblings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparar com outra aplicação</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {siblings.map((sibling) => (
                  <Link
                    key={sibling.id}
                    href={`/testes/equipes/${teamId}/comparar?a=${instanceId}&b=${sibling.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-accent/10"
                  >
                    {sibling.title ?? sibling.contextLabel}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {view.results.map((result) => {
              const who = result.participantName ?? "Participante";
              return (
                <Card key={result.id} className="transition-colors hover:bg-accent/10">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                    <Link href={`/testes/r/${result.id}`} className="min-w-0 flex-1">
                      <p className="font-medium">{who}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {result.participantEmail ? `${result.participantEmail} · ` : ""}
                        {result.label}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{new Date(result.createdAt).toLocaleString("pt-BR")}</span>
                      {view.canManage && <ReopenButton teamId={teamId} instanceId={instanceId} resultId={result.id} who={who} />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
