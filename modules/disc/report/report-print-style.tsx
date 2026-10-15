// A folha do relatório impressa tem que sair igual à do NestPro (exemplo-relatório-disc.pdf) em
// QUALQUER tema — o tema ativo muda --card, --primary, --border, o raio… e a impressão original
// usava a paleta do NestPro fixa (nestpro/app/globals.css, bloco @media print). Por isso, e só na
// impressão, a folha (.disc-report) fixa os tokens que ela usa. Na tela vale o tema normalmente.
// <style> em vez de classe Tailwind porque são variáveis custom + @page, não utilitários.
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 0; }
  /* Isolamento do site (some tudo menos a folha) = platform/ui/print-portal.tsx. */
  .tests-print-root { width: 210mm; }
  .disc-report {
    --background: hsl(235 15% 100%);
    --foreground: hsl(235 5% 15%);
    --card: hsl(235 15% 92%);
    --card-foreground: hsl(235 5% 15%);
    --primary: hsl(235 25% 30%);
    --primary-foreground: hsl(235 18% 93%);
    --muted-foreground: hsl(235 9% 50%);
    --border: hsl(235 25% 80%);
    --disc-color-d: hsl(340 70% 40%);
    --disc-color-i: hsl(40 100% 48%);
    --disc-color-s: hsl(150 70% 40%);
    --disc-color-c: hsl(198 100% 45%);
    --disc-color-d-interna: hsl(340 70% 60%);
    --disc-color-i-interna: hsl(40 50% 80%);
    --disc-color-s-interna: hsl(150 70% 80%);
    --disc-color-c-interna: hsl(198 50% 80%);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;

export function DiscReportPrintStyle() {
  return <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />;
}
