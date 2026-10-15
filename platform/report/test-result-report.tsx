import { PrintIsolationStyle, PrintPortal } from "../ui/print-portal";
import { getModuleReport } from "../modules/report-registry";
import { REPORT_FOOTER_SETTING } from "../../shared/report-settings";
import type { TestResultView } from "../../contracts/types";

// RELATÓRIO EMBUTÍVEL — exportado como "@venore/plugin-tests/report-view". É o que a página de
// resultado usa e o que plugin consumidor (vagas) deve usar para mostrar o resultado, em vez de
// copiar gráficos e impressão (regra 2 de docs/api-publica.md): a folha do módulo na tela e uma
// cópia isolada para a impressão (só a folha, sem o site, sempre em papel branco).
//
// O consumidor decide QUEM pode ver (autorização dele) e passa o TestResultView que obteve de
// getTestResultExternal. O texto do rodapé vem de getTestReportFooterText() (configurável no admin);
// sem ele usa o padrão.
export function TestResultReport({ result, footerText = REPORT_FOOTER_SETTING.defaultValue }: { result: TestResultView; footerText?: string }) {
  const Sheet = getModuleReport(result.testId);

  if (!Sheet) {
    return <p className="text-sm text-destructive">O teste &quot;{result.testId}&quot; não está instalado — não dá para exibir este resultado.</p>;
  }

  return (
    <>
      <PrintIsolationStyle />
      <div className="print:hidden">
        <Sheet result={result} footerText={footerText} />
      </div>
      <PrintPortal>
        <Sheet result={result} footerText={footerText} />
      </PrintPortal>
    </>
  );
}
