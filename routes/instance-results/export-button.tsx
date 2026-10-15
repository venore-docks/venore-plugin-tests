"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@venore/plugin-sdk/ui";
import { exportInstanceCsvAction } from "./actions";

// Baixa os resultados em planilha (CSV com BOM, abre certo no Excel). O texto do arquivo é gerado
// no servidor depois de conferir que quem pediu é da equipe.
export function ExportButton({ instanceId }: { instanceId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await exportInstanceCsvAction(instanceId);
            if (result.error || !result.csv || !result.filename) {
              setError(result.error ?? "Não foi possível gerar a planilha.");
              return;
            }
            setError(null);
            const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = result.filename;
            link.click();
            URL.revokeObjectURL(url);
          })
        }
      >
        <Download className="h-4 w-4" /> Baixar planilha
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
