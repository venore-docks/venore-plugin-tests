import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { EmptyState } from "@venore/plugin-sdk/ui";
import { getTestInstanceBySlug, getTestRunContent, listActiveTestModules } from "../../index";
import { getModule } from "../../platform/modules/registry";
import { RunFlow } from "../../platform/run/run-flow";

export const dynamic = "force-dynamic";

function NoContent({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState title="Teste sem perguntas" description={message} />
    </div>
  );
}

export default async function RunTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ slug?: string }>;
}) {
  const { moduleId } = await params;
  const { slug } = await searchParams;

  const module = getModule(moduleId);
  if (!module) {
    notFound();
  }

  const active = await listActiveTestModules();
  const isActive = active.success && active.data.some((summary) => summary.id === moduleId);
  if (!isActive) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState title="Teste indisponível" description="Este teste está desativado no momento. Tente novamente mais tarde." />
      </div>
    );
  }

  const here = `/testes/${moduleId}/teste${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`;
  const signInHref = `/api/auth/signin?callbackUrl=${encodeURIComponent(here)}`;

  const currentUserResult = await getCurrentUser();
  const currentUser = currentUserResult.success ? currentUserResult.data : null;
  const viewer = { loggedIn: Boolean(currentUser), name: currentUser?.name ?? null, email: currentUser?.email ?? null };

  if (!slug) {
    const contentResult = await getTestRunContent({ moduleId, instanceId: null });
    if (!contentResult.success) {
      return <NoContent message={contentResult.error.message} />;
    }
    return (
      <RunFlow
        moduleId={moduleId}
        moduleName={module.name}
        estimatedMinutes={module.estimatedMinutes}
        helpTitle={module.help.title}
        helpHtml={module.help.html}
        content={contentResult.data.content}
        instance={null}
        viewer={viewer}
        signInHref={signInHref}
      />
    );
  }

  const instanceResult = await getTestInstanceBySlug({ slug });
  if (!instanceResult.success || instanceResult.data.testId !== moduleId) {
    notFound();
  }
  const instance = instanceResult.data;

  if (instance.closed) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState title="Este link foi encerrado" description="Quem aplicou o teste não aceita mais respostas por este link." />
      </div>
    );
  }

  if (instance.identityMode === "login" && !currentUser) {
    redirect(signInHref);
  }

  const contentResult = await getTestRunContent({ moduleId, instanceId: instance.id });
  if (!contentResult.success) {
    return <NoContent message={contentResult.error.message} />;
  }

  return (
    <RunFlow
      moduleId={moduleId}
      moduleName={module.name}
      estimatedMinutes={module.estimatedMinutes}
      helpTitle={module.help.title}
      helpHtml={module.help.html}
      content={contentResult.data.content}
      instance={{
        id: instance.id,
        title: instance.title,
        contextLabel: instance.contextLabel,
        identityMode: instance.identityMode,
        teamName: instance.teamName,
      }}
      viewer={viewer}
      signInHref={signInHref}
    />
  );
}

