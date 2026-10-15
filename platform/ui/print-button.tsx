"use client";

import { Printer } from "lucide-react";
import { Button } from "@venore/plugin-sdk/ui";

// O relatório imprime sem depender de nenhuma opção do navegador ("gráficos em segundo plano"):
// gráficos e fundos são elementos reais do DOM e a folha é isolada do site (ver print-portal.tsx).
export function PrintButton() {
  return (
    <Button variant="outline" size="sm" className="gap-2 print:hidden" onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> Imprimir
    </Button>
  );
}
