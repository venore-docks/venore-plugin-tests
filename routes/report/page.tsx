import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { Button, EmptyState } from "@venore/plugin-sdk/ui";
import { claimTestResult, getTestResult } from "../../index";
import { readAccessibleResultIds } from "../../platform/access-cookie";
import { LGPD_LOGIN_NOTICE } from "../../platform/copy";
import { getModule } from "../../platform/modules/registry";
import { PrintButton } from "../../platform/ui/print-button";
import { getReportFooterText } from "../../platform/report/settings";
import { TestResultReport } from "../../platform/report/test-result-report";

export const dynamic = "force-dynamic";

export default async function TestResultPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  const here = `/testes/r/${resultId}`;
  const signInHref = `/api/auth/signin?callbackUrl=${encodeURIComponent(here)}`;

  const capabilityResultIds = await readAccessibleResultIds();
  let resultResult = await getTestResult({ resultId, capabilityResultIds });

  // Resposta avulsa ainda sem dono + quem abriu está logado: vincula à conta e relê.
  if (!resultResult.success && resultResult.error.code === "not_claimed") {
    const claimed = await claimTestResult({ resultId });
    if (claimed.success) {
      resultResult = await getTestResult({ resultId, capabilityResultIds });
    }
  }

  if (!resultResult.success) {
    const { code } = resultResult.error;
    if (code === "not_found") {
      notFound();
    }
    if (code === "login_required") {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
          <EmptyState title="Entre para ver o seu resultado" description="O resultado fica vinculado à sua conta — só você e quem aplicou o teste (quando houver) têm acesso." />
          <Button asChild size="lg">
            <Link href={signInHref}>Entrar</Link>
          </Button>
          <p className="text-xs text-muted-foreground">{LGPD_LOGIN_NOTICE}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState title="Sem acesso a este resultado" description={resultResult.error.message} />
      </div>
    );
  }

  const result = resultResult.data;
  const module = getModule(result.testId);
  // "Persistente (Sc)" — o resumo do resultado no topo, antes do relatório completo.
  const headline = module?.describeHeadline?.(result.headline, result.headlineSecondary) ?? "Seu resultado";
  const currentUserResult = await getCurrentUser();
  const loggedIn = currentUserResult.success && Boolean(currentUserResult.data);
  // Quem respondeu sem login só enxerga este resultado neste navegador, por algumas horas.
  const temporaryAccess = !loggedIn && capabilityResultIds.includes(result.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{module?.name ?? "Resultado"}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{headline}</h1>
          <p className="text-sm text-muted-foreground">Contexto considerado: {result.contextLabel}</p>
        </div>
        <PrintButton />
      </div>

      {temporaryAccess && (
        <div className="rounded-panel border border-warning-border bg-warning-soft p-4 text-sm print:hidden">
          Este resultado fica disponível <strong>neste navegador por algumas horas</strong>, porque você respondeu sem entrar. Use
          &quot;Imprimir&quot; para salvar em PDF agora — depois só quem aplicou o teste poderá consultá-lo.
        </div>
      )}

      {module?.howToRead && (
        <details className="rounded-panel border border-border bg-card px-4 py-3 text-sm print:hidden">
          <summary className="cursor-pointer font-medium">{module.howToRead.title}</summary>
          <div className="mt-3 text-muted-foreground [&_span]:font-medium [&_span]:text-foreground" dangerouslySetInnerHTML={{ __html: module.howToRead.html }} />
        </details>
      )}

      <TestResultReport result={result} footerText={await getReportFooterText()} />
    </div>
  );
}
