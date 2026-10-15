"use client";

import { useActionState, useState } from "react";
import { Button, Input, useActionToast } from "@venore/plugin-sdk/ui";
import { createInstanceAction, type CreateInstanceActionState } from "./actions";

const initialState: CreateInstanceActionState = { error: null };

export type FormModule = { id: string; name: string; sets: Array<{ id: string; title: string; version: number; isDefault: boolean }> };

export function CreateInstanceForm({ teamId, modules }: { teamId: string; modules: FormModule[] }) {
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const currentSets = modules.find((module) => module.id === moduleId)?.sets ?? [];
  const boundAction = createInstanceAction.bind(null, teamId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  useActionToast({ pending, error: state.error, successMessage: "Link de teste gerado." });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="tests-instance-module">
            Teste
          </label>
          <select
            id="tests-instance-module"
            name="testId"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={moduleId}
            onChange={(event) => setModuleId(event.target.value)}
          >
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="tests-instance-title">
            Nome desta aplicação (opcional)
          </label>
          <Input id="tests-instance-title" name="title" placeholder="Ex.: 1º trimestre 2026" maxLength={120} />
        </div>
      </div>
      {currentSets.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="tests-instance-set">
            Conjunto de perguntas
          </label>
          <select key={moduleId} id="tests-instance-set" name="questionSetId" defaultValue={currentSets.find((set) => set.isDefault)?.id ?? currentSets[0].id} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {currentSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.title} (v{set.version}){set.isDefault ? " — padrão" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">A aplicação fixa a versão publicada de hoje: editar o conjunto depois não muda esta aplicação.</p>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="tests-instance-context">
          Contexto em que as pessoas devem pensar ao responder
        </label>
        <Input id="tests-instance-context" name="contextLabel" placeholder="Ex.: no time de vendas" defaultValue="No trabalho" maxLength={120} required />
        <p className="text-xs text-muted-foreground">
          Este contexto aparece em todas as perguntas e no resultado. Quem responde pensa em UM ambiente do começo ao fim — escolha o mesmo
          ao repetir a aplicação para poder comparar.
        </p>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          Gerar link de teste
        </Button>
      </div>
    </form>
  );
}
