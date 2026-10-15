import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@venore/plugin-sdk/auth";
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@venore/plugin-sdk/ui";
import { listMyTestTeams } from "../../index";
import { CreateTeamForm } from "./create-team-form";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.success || !currentUser.data) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent("/testes/equipes")}`);
  }

  const teamsResult = await listMyTestTeams();
  const teams = teamsResult.success ? teamsResult.data : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minhas equipes</h1>
        <p className="text-sm text-muted-foreground">Crie uma equipe para aplicar testes, gerar links e acompanhar os resultados.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTeamForm />
        </CardContent>
      </Card>

      {teams.length === 0 ? (
        <EmptyState title="Nenhuma equipe ainda" description="Crie a primeira equipe acima para começar a aplicar testes." />
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/testes/equipes/${team.id}`}
              className="rounded-panel border border-border bg-card p-4 transition-colors hover:bg-accent/10"
            >
              <p className="font-medium">{team.name}</p>
              {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
