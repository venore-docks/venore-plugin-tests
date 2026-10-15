"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@venore/plugin-sdk/ui";
import { createSetAction } from "./actions";

export function NewSetForm({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createSetAction(moduleId, title);
      if (result.error) return setError(result.error);
      router.push(`/admin/tests/conteudo/${moduleId}/${result.setId}`);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <label htmlFor="new-set-title" className="text-xs text-muted-foreground">
          Novo conjunto de perguntas
        </label>
        <Input id="new-set-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Avaliação de vendas — 2026" maxLength={120} required className="w-72" />
      </div>
      <Button type="submit" disabled={pending}>
        Criar
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  );
}
