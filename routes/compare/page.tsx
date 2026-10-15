import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { AdminAccessDenied, Card, CardContent, EmptyState } from "@venore/plugin-sdk/ui";
import { compareTestInstances } from "../../index";
import { getModule } from "../../platform/modules/registry";

export const dynamic = "force-dynamic";

// Mesma equipe em dois momentos (ex.: 1º e 2º trimestre): quem mudou de perfil, quem só respondeu
// em um deles. As pessoas são casadas pelo e-mail (ou pela conta).
export default async function CompareInstancesPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { teamId } = await params;
  const { a, b } = await searchParams;

  const here = `/testes/equipes/${teamId}/comparar?a=${a ?? ""}&b=${b ?? ""}`;
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(here)}`);
  }

  if (!a || !b) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState title="Escolha duas aplicações" description="Abra os resultados de uma aplicação e use 'Comparar com outra aplicação'." />
      </div>
    );
  }

  const result = await compareTestInstances({ teamId, instanceAId: a, instanceBId: b });
  if (!result.success) {
    return <AdminAccessDenied message={result.error.message} />;
  }

  const { a: first, b: second, comparison, sameContext } = result.data;
  const moduleName = getModule(first.testId)?.name ?? first.testId;
  const nameOf = (instance: typeof first) => instance.title ?? new Date(instance.createdAt).toLocaleDateString("pt-BR");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comparação de aplicações</h1>
        <p className="text-sm text-muted-foreground">
          {moduleName}: <span className="font-medium text-foreground">{nameOf(first)}</span> × <span className="font-medium text-foreground">{nameOf(second)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {comparison.matched} pessoa(s) responderam as duas · {comparison.changed} mudou(aram) de resultado
          {comparison.unmatchedA + comparison.unmatchedB > 0 && <> · {comparison.unmatchedA + comparison.unmatchedB} resposta(s) sem identificação não puderam ser casadas</>}
        </p>
      </div>

      {!sameContext && (
        <div className="rounded-panel border border-warning-border bg-warning-soft p-4 text-sm">
          As duas aplicações usaram <strong>contextos diferentes</strong> ({first.contextLabel} × {second.contextLabel}). Como o resultado vale para o contexto
          em que a pessoa respondeu, a diferença pode refletir o ambiente e não uma mudança de perfil.
        </div>
      )}

      {comparison.rows.length === 0 ? (
        <EmptyState title="Nada para comparar" description="Nenhuma das duas aplicações tem respostas identificadas." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-xs text-muted-foreground">
                  <th className="pb-2 text-start font-medium">Pessoa</th>
                  <th className="pb-2 text-start font-medium">{nameOf(first)}</th>
                  <th className="pb-2 text-start font-medium">{nameOf(second)}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={`${row.who}-${row.a}-${row.b}`} className="border-t border-border">
                    <td className="py-2 pe-3 font-medium">{row.who}</td>
                    <td className="py-2 pe-3">{row.a ?? <span className="text-muted-foreground">não respondeu</span>}</td>
                    <td className="py-2">
                      {row.b ?? <span className="text-muted-foreground">não respondeu</span>}
                      {row.changed && <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">mudou</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Link href={`/testes/equipes/${teamId}`} className="text-sm text-muted-foreground underline underline-offset-2">
        ← Voltar para a equipe
      </Link>
    </div>
  );
}
