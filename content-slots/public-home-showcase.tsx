import Link from "next/link";
import { Button } from "@venore/plugin-sdk/ui";

// Vitrine da home pública quando não há entry "home" no CMS — ponto de entrada simplificado:
// "acessa o site, clica num botão, já faz o teste sem muita complicação". Sem isPluginActive aqui:
// quem itera publicHomeShowcase (o core) já só chama plugins ativos.
export function renderTestsPublicHomeShowcase() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-panel border border-border bg-card p-8 text-center shadow-panel">
      <h2 className="text-2xl font-semibold tracking-tight">Descubra seu perfil e seus pontos fortes</h2>
      <p className="text-sm text-muted-foreground">
        Testes comportamentais e de conhecimento que levam poucos minutos — sozinho ou com sua equipe.
      </p>
      <Button asChild size="lg">
        <Link href="/testes">Ver os testes</Link>
      </Button>
    </section>
  );
}
