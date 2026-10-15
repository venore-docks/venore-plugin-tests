import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { getPluginAdminPageData } from "@venore/plugin-sdk/admin";
import { AdminAccessDenied, AdminPageHeader, Card, CardContent, EmptyState } from "@venore/plugin-sdk/ui";
import { listAllTestModules } from "../../index";
import { getReportFooterText } from "../../platform/report/settings";
import { ModuleToggle } from "./module-toggle";
import { ReportFooterForm } from "./footer-form";

export default async function AdminTestsPage() {
  const gate = await getPluginAdminPageData("tests");
  if (!gate.granted) {
    return <AdminAccessDenied message="Você não tem permissão para gerenciar os módulos de teste." />;
  }

  const result = await listAllTestModules();
  if (!result.success) {
    return <p className="text-sm text-destructive">Erro ao carregar os módulos: {result.error.message}</p>;
  }

  const modules = result.data;
  const footerText = await getReportFooterText();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Testes"
        description="Ligue ou desligue cada módulo de teste. Desligar esconde o teste do catálogo e impede novas aplicações e respostas — os resultados já gravados continuam acessíveis."
      />

      {modules.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="Nenhum módulo instalado" description="Este plugin não tem módulos de teste registrados." />
      ) : (
        <div className="flex flex-col gap-3">
          {modules.map((module) => (
            <Card key={module.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">{module.name}</p>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <p className="text-xs text-muted-foreground">
                    v{module.version} · ≈ {module.estimatedMinutes} min · conteúdo {module.contentKind === "static" ? "fixo" : "criado por quem usa"} ·
                    licença: {module.source.license}
                  </p>
                  {module.contentKind === "authored" && !module.hasContent && (
                    <p className="text-xs text-warning">
                      Sem conjunto de perguntas padrão publicado — o teste {module.enabled ? "está ligado mas" : ""} não aparece para ninguém até você criar e publicar o conteúdo.
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <ModuleToggle moduleId={module.id} name={module.name} initialEnabled={module.enabled} />
                  {module.contentKind === "authored" && (
                    <Link href={`/admin/tests/conteudo/${module.id}`} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-accent/10">
                      Editar conteúdo
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <ReportFooterForm initialText={footerText} />
        </CardContent>
      </Card>
    </div>
  );
}
