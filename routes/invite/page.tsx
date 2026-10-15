import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, EmptyState } from "@venore/plugin-sdk/ui";
import { getTestInstanceBySlug } from "../../index";
import { getModule } from "../../platform/modules/registry";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instanceResult = await getTestInstanceBySlug({ slug });
  if (!instanceResult.success) {
    notFound();
  }

  const { testId, contextLabel, teamName, title, closed } = instanceResult.data;
  const module = getModule(testId);

  if (closed) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState title="Este link foi encerrado" description="Quem aplicou o teste não aceita mais respostas por este link." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Você foi convidado para o {module?.name ?? "teste"}</h1>
      <p className="text-sm text-muted-foreground">
        {teamName ? (
          <>
            A equipe <span className="font-medium text-foreground">{teamName}</span>
            {title ? <> ({title})</> : null} pediu que você faça o teste considerando o contexto{" "}
            <span className="font-medium text-foreground">{contextLabel}</span>.
          </>
        ) : (
          <>
            Faça o teste considerando o contexto <span className="font-medium text-foreground">{contextLabel}</span>.
          </>
        )}
      </p>
      <Button asChild size="lg">
        <Link href={`/testes/${testId}/teste?slug=${slug}`}>Continuar</Link>
      </Button>
    </div>
  );
}
