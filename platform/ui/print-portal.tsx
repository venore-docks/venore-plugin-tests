"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Cópia do relatório que SÓ existe na impressão. Fica como filho direto do <body>, fora da casca do
// tema (header, breadcrumbs, rodapé, sidebar…): com PrintIsolationStyle, `body > :not(.tests-print-root)`
// some com todo o resto, então o papel sai só com a folha do relatório, igual em qualquer tema,
// claro ou escuro. Esconder a casca por seletor de região não serve — cada tema marca as suas de
// um jeito. Na tela o contêiner fica display:none; os gráficos têm tamanho fixo (ver
// platform/ui/fixed-chart), então não precisam ser medidos enquanto escondidos.
export function PrintPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.createElement("div");
    element.className = "tests-print-root";
    document.body.appendChild(element);
    setTarget(element);
    return () => {
      element.remove();
    };
  }, []);

  return target ? createPortal(children, target) : null;
}

const ISOLATION_CSS = `
.tests-print-root { display: none; }

@media print {
  html, body { background: #fff !important; }
  /* Papel é branco: só a cópia do relatório (PrintPortal) sobrevive; o site inteiro some. */
  body > :not(.tests-print-root) { display: none !important; }
  .tests-print-root { display: block !important; margin: 0; padding: 0; background: #fff; }
}
`;

export function PrintIsolationStyle() {
  return <style dangerouslySetInnerHTML={{ __html: ISOLATION_CSS }} />;
}
