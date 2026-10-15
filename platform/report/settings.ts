import { getSetting } from "@venore/plugin-sdk/settings";
import { REPORT_FOOTER_SETTING, resolveFooterText } from "../../shared/report-settings";

// Texto do rodapé do relatório (configurável no admin do plugin). Leitura pública: o relatório é
// renderizado para quem tem acesso a ele, não só para administradores.
export async function getReportFooterText(): Promise<string> {
  const result = await getSetting({ key: REPORT_FOOTER_SETTING.key });
  return resolveFooterText(result.success ? result.data?.value : undefined);
}
