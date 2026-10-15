import Link from "next/link";
import { notFound } from "next/navigation";
import { getPluginAdminPageData } from "@venore/plugin-sdk/admin";
import { AdminAccessDenied, AdminPageHeader, Card, CardContent, EmptyState } from "@venore/plugin-sdk/ui";
import { listTestQuestionSets } from "../../index";
import { getModule } from "../../platform/modules/registry";
import { NewSetForm } from "./new-set-form";
import { StarterButton } from "./starter-button";

export default async function AdminContentListPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const gate = await getPluginAdminPageData("tests");
  if (!gate.granted) {
    return <AdminAccessDenied message="Você não tem permissão para gerenciar os testes." />;
  }

  const module = getModule(moduleId);
  if (!module || module.contentKind !== "authored") {
    notFound();
  }

  const result = await listTestQuestionSets({ moduleId });
  if (!result.success) {
    return <AdminAccessDenied message={result.error.message} />;
  }
  const sets = result.data;
  const hasDefault = sets.some((set) => set.isDefault && !set.archived);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Conteúdo — ${module.name}`}
        description="Cada conjunto de perguntas tem um rascunho (você edita à vontade) e versões publicadas (o que as pessoas respondem). Editar o rascunho ou publicar uma versão nova nunca altera aplicações e respostas que já existem."
      />

      <div className="flex flex-wrap items-start gap-4">
        <NewSetForm moduleId={moduleId} />
        {!hasDefault && <StarterButton moduleId={moduleId} />}
      </div>

      {!hasDefault && (
        <p className="rounded-panel border border-warning-border bg-warning-soft p-3 text-sm">
          Este teste ainda não tem um conjunto <strong>padrão publicado</strong> — sem ele, ninguém consegue fazer o teste avulso nem criar aplicações. Crie e publique um conjunto (ou use
          o conjunto de exemplo) e marque-o como padrão.
        </p>
      )}

      {sets.length === 0 ? (
        <EmptyState title="Nenhum conjunto de perguntas" description="Crie um conjunto novo ou gere o conjunto de exemplo para começar." />
      ) : (
        <div className="flex flex-col gap-3">
          {sets.map((set) => (
            <Card key={set.id} className={set.archived ? "opacity-60" : undefined}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {set.title}
                    {set.isDefault && <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">padrão</span>}
                    {set.archived && <span className="ms-2 text-xs font-normal text-muted-foreground">(arquivado)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {set.questionCount} pergunta(s) ·{" "}
                    {set.publishedVersion === null ? "nunca publicado" : `versão ${set.publishedVersion}${set.hasUnpublishedChanges ? " (há alterações não publicadas)" : ""}`} ·{" "}
                    {set.instanceCount} aplicação(ões) · editado em {new Date(set.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Link href={`/admin/tests/conteudo/${moduleId}/${set.id}`} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-accent/10">
                  {set.archived ? "Ver" : "Editar"}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Link href="/admin/tests" className="text-sm text-muted-foreground underline underline-offset-2">
        ← Voltar para os testes
      </Link>
    </div>
  );
}
