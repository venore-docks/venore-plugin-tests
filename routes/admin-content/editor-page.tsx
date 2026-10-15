import Link from "next/link";
import { notFound } from "next/navigation";
import { getPluginAdminPageData } from "@venore/plugin-sdk/admin";
import { AdminAccessDenied, AdminPageHeader } from "@venore/plugin-sdk/ui";
import { getTestQuestionSet } from "../../index";
import { getModule } from "../../platform/modules/registry";
import { SetEditor, type AuthoringSpecView, type EditorInitial } from "./set-editor";

export default async function AdminContentEditorPage({ params }: { params: Promise<{ moduleId: string; setId: string }> }) {
  const { moduleId, setId } = await params;
  const gate = await getPluginAdminPageData("tests");
  if (!gate.granted) {
    return <AdminAccessDenied message="Você não tem permissão para gerenciar os testes." />;
  }

  const module = getModule(moduleId);
  if (!module?.authoring) {
    notFound();
  }

  const result = await getTestQuestionSet({ setId });
  if (!result.success) {
    if (result.error.code === "not_found") notFound();
    return <AdminAccessDenied message={result.error.message} />;
  }
  const set = result.data;
  if (set.moduleId !== moduleId) {
    notFound();
  }

  // Só o que é serializável do AuthoringSpec vai ao navegador (as funções ficam no servidor).
  const { allowedKinds, optionsHaveCorrect, minQuestions, maxQuestions, minOptions, maxOptions, scalePoints, questionFields, setFields } = module.authoring;
  const spec: AuthoringSpecView = { allowedKinds, optionsHaveCorrect, minQuestions, maxQuestions, minOptions, maxOptions, scalePoints, questionFields, setFields };

  const initial: EditorInitial = {
    setId: set.id,
    moduleId,
    moduleName: module.name,
    title: set.title,
    description: set.description ?? "",
    draft: set.draft,
    publishedVersion: set.publishedVersion,
    hasUnpublishedChanges: set.hasUnpublishedChanges,
    isDefault: set.isDefault,
    archived: set.archived,
    instanceCount: set.instanceCount,
    resultCount: set.resultCount,
    versions: set.versions.map((version) => ({ version: version.version, title: version.title, publishedAt: new Date(version.publishedAt).toISOString() })),
    publishProblems: set.publishProblems.map((problem) => problem.message),
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={set.title} description={`Conteúdo do teste "${module.name}". As alterações só valem para quem responde depois de você publicar uma nova versão.`} />
      <SetEditor initial={initial} spec={spec} />
      <Link href={`/admin/tests/conteudo/${moduleId}`} className="text-sm text-muted-foreground underline underline-offset-2">
        ← Voltar para os conjuntos
      </Link>
    </div>
  );
}
