import { EmptyState } from "@venore/plugin-sdk/ui";

// Fim do teste quando o participante NÃO vê o próprio resultado (ex: candidato de vaga — quem avalia
// vê). Página estática: não revela nada sobre a resposta.
export default function TestDonePage() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState title="Resposta enviada" description="Obrigado! Suas respostas foram registradas. Você já pode fechar esta página." />
    </div>
  );
}
