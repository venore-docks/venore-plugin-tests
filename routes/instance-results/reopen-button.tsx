"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@venore/plugin-sdk/ui";
import { reopenResultAction } from "./actions";

// "Reabrir" apaga a resposta daquela pessoa nesta aplicação para ela poder responder de novo (e-mail
// errado, teste interrompido). Sem volta — por isso a confirmação.
export function ReopenButton({ teamId, instanceId, resultId, who }: { teamId: string; instanceId: string; resultId: string; who: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={pending}>
          Reabrir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reabrir a resposta de {who}?</AlertDialogTitle>
          <AlertDialogDescription>
            A resposta atual será apagada e a pessoa poderá responder de novo pelo mesmo link. Isso não pode ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const result = await reopenResultAction(teamId, instanceId, resultId);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                router.refresh();
              })
            }
          >
            Reabrir e apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
