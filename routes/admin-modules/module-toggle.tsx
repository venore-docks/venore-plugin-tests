"use client";

import { useState, useTransition } from "react";
import { Switch } from "@venore/plugin-sdk/ui";
import { setModuleEnabledAction } from "./actions";

export function ModuleToggle({ moduleId, name, initialEnabled }: { moduleId: string; name: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{enabled ? "Ligado" : "Desligado"}</span>
        <Switch
          checked={enabled}
          disabled={pending}
          aria-label={`${enabled ? "Desligar" : "Ligar"} o módulo ${name}`}
          onCheckedChange={(next) => {
            const previous = enabled;
            setEnabled(next);
            setError(null);
            startTransition(async () => {
              const result = await setModuleEnabledAction(moduleId, next);
              if (result.error) {
                setEnabled(previous);
                setError(result.error);
              }
            });
          }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
