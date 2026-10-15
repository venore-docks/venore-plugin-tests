import { permanentRedirect } from "next/navigation";

// APELIDOS das URLs do antigo plugin DISC (/disc/...). Links de convite e de relatório já foram
// distribuídos com esses caminhos (e o plugin de vagas manda o candidato para /disc/teste), então
// continuam funcionando — redirecionam, de forma permanente, para o endereço novo em /testes.
// Nunca remover sem antes conferir que nenhum link antigo está em uso.

export function DiscAliasLanding(): never {
  permanentRedirect("/testes/disc");
}

export async function DiscAliasRun({ searchParams }: { searchParams: Promise<{ slug?: string; ambiente?: string }> }): Promise<never> {
  const { slug } = await searchParams;
  // `ambiente` (avulso, antigo) não existe mais: o contexto agora é uma etapa do próprio teste.
  permanentRedirect(`/testes/disc/teste${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`);
}

export async function DiscAliasReport({ params }: { params: Promise<{ reportId: string }> }): Promise<never> {
  const { reportId } = await params;
  permanentRedirect(`/testes/r/${encodeURIComponent(reportId)}`);
}

export async function DiscAliasInvite({ params }: { params: Promise<{ slug: string }> }): Promise<never> {
  const { slug } = await params;
  permanentRedirect(`/testes/d/${encodeURIComponent(slug)}`);
}

export function DiscAliasMyResults(): never {
  permanentRedirect("/testes/meus-resultados");
}

export function DiscAliasTeams(): never {
  permanentRedirect("/testes/equipes");
}

export async function DiscAliasTeam({ params }: { params: Promise<{ teamId: string }> }): Promise<never> {
  const { teamId } = await params;
  permanentRedirect(`/testes/equipes/${encodeURIComponent(teamId)}`);
}

export async function DiscAliasInstance({ params }: { params: Promise<{ teamId: string; instanceId: string }> }): Promise<never> {
  const { teamId, instanceId } = await params;
  permanentRedirect(`/testes/equipes/${encodeURIComponent(teamId)}/${encodeURIComponent(instanceId)}`);
}
