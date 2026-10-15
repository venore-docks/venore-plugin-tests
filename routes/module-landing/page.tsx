import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@venore/plugin-sdk/ui";
import { listActiveTestModules } from "../../index";
import { getModule } from "../../platform/modules/registry";

export const dynamic = "force-dynamic";

export default async function ModuleLandingPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const module = getModule(moduleId);
  if (!module) {
    notFound();
  }

  const active = await listActiveTestModules();
  const isActive = active.success && active.data.some((summary) => summary.id === moduleId);
  if (!isActive) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState title="Teste indisponível" description="Este teste está desativado no momento." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{module.name}</h1>
        <p className="text-sm text-muted-foreground">{module.description}</p>
        <p className="text-xs text-muted-foreground">Leva cerca de {module.estimatedMinutes} minutos.</p>
        <Button asChild size="lg">
          <Link href={`/testes/${module.id}/teste`}>Fazer o teste agora</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{module.help.title}</CardTitle>
        </CardHeader>
        <CardContent
          className="space-y-3 text-sm text-muted-foreground [&_span]:font-medium [&_span]:text-foreground"
          dangerouslySetInnerHTML={{ __html: module.help.html }}
        />
      </Card>
    </div>
  );
}
