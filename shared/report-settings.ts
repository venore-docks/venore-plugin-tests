// Configurações do plugin que o ADMIN edita (guardadas no sistema de settings do core, chave
// "tests.*" — gravar exige settings.manage ou tests.settings.manage; ver manifest).

export const REPORT_FOOTER_SETTING = {
  key: "tests.report.footerText",
  // Padrão = o que o NestPro imprimia (o relatório do legado tinha este texto fixo no rodapé).
  defaultValue: "www.nestpro.com.br",
} as const;

export const MAX_REPORT_FOOTER_LENGTH = 120;

// Valor guardado → texto do rodapé. Ausente (nunca configurado) = o padrão. VAZIO é uma escolha
// válida do admin: o relatório sai sem rodapé.
export function resolveFooterText(stored: unknown): string {
  if (typeof stored !== "string") return REPORT_FOOTER_SETTING.defaultValue;
  return normalizeFooterText(stored);
}

// Uma linha só, espaços colapsados, no máximo MAX_REPORT_FOOTER_LENGTH caracteres. O rodapé vai
// impresso em todo relatório, então não aceita quebra de linha nem texto longo.
export function normalizeFooterText(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, MAX_REPORT_FOOTER_LENGTH);
}
