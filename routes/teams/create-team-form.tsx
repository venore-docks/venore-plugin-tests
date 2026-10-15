"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, useActionToast } from "@venore/plugin-sdk/ui";
import { createTeamAction, type CreateTeamActionState } from "./actions";

const initialState: CreateTeamActionState = { error: null };

export function CreateTeamForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTeamAction, initialState);
  useActionToast({ pending, error: state.error, successMessage: "Equipe criada.", onSuccess: () => router.refresh() });

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="tests-team-name">
          Nome da equipe
        </label>
        <Input id="tests-team-name" name="name" placeholder="Ex.: Time comercial" required />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="tests-team-description">
          Descrição (opcional)
        </label>
        <Textarea id="tests-team-description" name="description" rows={1} placeholder="Ex.: Vendas e pós-venda" />
      </div>
      <Button type="submit" disabled={pending}>
        Criar equipe
      </Button>
    </form>
  );
}
