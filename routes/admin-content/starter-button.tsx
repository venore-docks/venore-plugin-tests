"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@venore/plugin-sdk/ui";
import { createStarterAction } from "./actions";

// "Criar conjunto de exemplo": grava, PUBLICA e torna padrão o conteúdo de demonstração do módulo —
// o teste passa a funcionar de imediato. Depois é só editar ou substituir.
export function StarterButton({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1 pt-5">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await createStarterAction(moduleId);
            if (result.error) return setError(result.error);
            router.push(`/admin/tests/conteudo/${moduleId}/${result.setId}`);
          })
        }
      >
        Criar conjunto de exemplo
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
