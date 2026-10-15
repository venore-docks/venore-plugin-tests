"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@venore/plugin-sdk/ui";
import { setInstanceClosedAction } from "./actions";

// Encerrar o link impede respostas novas (resultados já gravados continuam); reabrir desfaz.
export function CloseButton({ teamId, instanceId, closed }: { teamId: string; instanceId: string; closed: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setInstanceClosedAction(teamId, instanceId, !closed);
            if (result.error) {
              setError(result.error);
              return;
            }
            setError(null);
            router.refresh();
          })
        }
      >
        {closed ? "Reabrir link" : "Encerrar link"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
