import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { AdminAccessDenied, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@venore/plugin-sdk/ui";
import { getTestTeam, listActiveTestModules, listPublishedTestQuestionSets, listTeamTestInstances } from "../../index";
import { getModule } from "../../platform/modules/registry";
import { CloseButton } from "./close-button";
import { CopyLinkButton } from "./copy-link-button";
import { CreateInstanceForm } from "./create-instance-form";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/testes/equipes/${teamId}`)}`);
  }

  const teamResult = await getTestTeam({ teamId });
  if (!teamResult.success) {
    return <AdminAccessDenied message={teamResult.error.message} />;
  }
  const team = teamResult.data;
  const isAdmin = team.viewerRole === "admin";

  const instancesResult = await listTeamTestInstances({ teamId });
  const instances = instancesResult.success ? instancesResult.data : [];

  const modulesResult = await listActiveTestModules();
  const modules = modulesResult.success
    ? await Promise.all(
        modulesResult.data.map(async (module) => {
          const sets = module.contentKind === "authored" ? await listPublishedTestQuestionSets({ moduleId: module.id }) : null;
          return { id: module.id, name: module.name, sets: sets && sets.success ? sets.data : [] };
        }),
      )
    : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
        {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Nova aplicação de teste</CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum teste está ativo no momento.</p>
            ) : (
              <CreateInstanceForm teamId={teamId} modules={modules} />
            )}
          </CardContent>
        </Card>
      )}

      {instances.length === 0 ? (
        <EmptyState
          title="Nenhuma aplicação ainda"
          description={isAdmin ? "Gere um link acima para compartilhar com a equipe." : "Quem administra a equipe ainda não gerou links de teste."}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">
                    {instance.title ?? getModule(instance.testId)?.name ?? instance.testId}
                    {instance.closed && <span className="ms-2 text-xs font-normal text-muted-foreground">(encerrado)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getModule(instance.testId)?.name ?? instance.testId} · {instance.contextLabel} · {instance.responseCount}{" "}
                    {instance.responseCount === 1 ? "resposta" : "respostas"}
                  </p>
                  <p className="text-xs text-muted-foreground">/testes/d/{instance.shareSlug}</p>
                </div>
                <div className="flex gap-2">
                  <CopyLinkButton path={`/testes/d/${instance.shareSlug}`} />
                  {isAdmin && <CloseButton teamId={teamId} instanceId={instance.id} closed={instance.closed} />}
                  <Link
                    href={`/testes/equipes/${teamId}/${instance.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-accent/10"
                  >
                    Ver resultados
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
