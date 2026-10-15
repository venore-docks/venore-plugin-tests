"use client";

import { useActionState } from "react";
import { Button, Input } from "@venore/plugin-sdk/ui";
import { MAX_REPORT_FOOTER_LENGTH } from "../../shared/report-settings";
import { saveReportFooterAction, type SaveFooterActionState } from "./footer-actions";

const INITIAL: SaveFooterActionState = { error: null, saved: false };

export function ReportFooterForm({ initialText }: { initialText: string }) {
  const [state, formAction, pending] = useActionState(saveReportFooterAction, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="tests-footer-text" className="text-sm font-medium">
        Texto no rodapé do relatório
      </label>
      <Input id="tests-footer-text" name="footerText" defaultValue={initialText} maxLength={MAX_REPORT_FOOTER_LENGTH} placeholder="www.seusite.com.br" />
      <p className="text-xs text-muted-foreground">Aparece no fim de todo relatório, na tela e no PDF impresso. Deixe vazio para não mostrar rodapé. Até {MAX_REPORT_FOOTER_LENGTH} caracteres, uma linha.</p>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        {state.saved && <span className="text-sm text-success">Salvo.</span>}
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
