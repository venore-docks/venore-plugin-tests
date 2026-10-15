import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { Card, CardContent, EmptyState } from "@venore/plugin-sdk/ui";
import { listMyTestResults } from "../../index";

export const dynamic = "force-dynamic";

export default async function MyResultsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent("/testes/meus-resultados")}`);
  }

  const resultsResult = await listMyTestResults();
  const results = resultsResult.success ? resultsResult.data : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meus resultados</h1>
        <p className="text-sm text-muted-foreground">Todos os testes que você já fez.</p>
      </div>

      {results.length === 0 ? (
        <EmptyState title="Nenhum resultado ainda" description="Faça um teste para ver o resultado aqui." />
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((result) => (
            <Link key={result.id} href={`/testes/r/${result.id}`}>
              <Card className="transition-colors hover:bg-accent/10">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium">{result.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.testName} · {result.contextLabel}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(result.createdAt).toLocaleString("pt-BR")}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
