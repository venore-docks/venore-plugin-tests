import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@venore/plugin-sdk/ui";
import { listActiveTestModules } from "../../index";

export const dynamic = "force-dynamic";

// Ponto de entrada: os testes que o administrador deixou ligados. "Aplicar em uma equipe" fica como
// caminho secundário, discreto — quem só quer fazer o teste não deve achar que precisa dele.
export default async function TestsCatalogPage() {
  const result = await listActiveTestModules();
  const modules = result.success ? result.data : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Testes</h1>
        <p className="text-sm text-muted-foreground">Escolha um teste. Leva poucos minutos e o resultado fica guardado na sua conta.</p>
      </div>

      {modules.length === 0 ? (
        <EmptyState title="Nenhum teste disponível" description="Os testes estão desativados no momento." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((module) => (
            <Card key={module.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{module.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">{module.description}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">≈ {module.estimatedMinutes} min</span>
                  <Button asChild size="sm">
                    <Link href={`/testes/${module.id}`}>Conhecer e começar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Lidera um grupo?{" "}
        <Link href="/testes/equipes" className="font-medium text-foreground underline underline-offset-2">
          Aplique um teste na sua equipe
        </Link>
      </p>
    </div>
  );
}
