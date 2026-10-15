import { describe, expect, it } from "vitest";
import { MAX_REPORT_FOOTER_LENGTH, normalizeFooterText, REPORT_FOOTER_SETTING, resolveFooterText } from "./report-settings";

describe("texto do rodapé do relatório", () => {
  it("sem configuração usa o padrão do NestPro", () => {
    expect(resolveFooterText(undefined)).toBe(REPORT_FOOTER_SETTING.defaultValue);
    expect(resolveFooterText(null)).toBe("www.nestpro.com.br");
    expect(resolveFooterText(42)).toBe("www.nestpro.com.br");
  });

  it("texto vazio é uma escolha válida: relatório sem rodapé", () => {
    expect(resolveFooterText("")).toBe("");
    expect(resolveFooterText("   ")).toBe("");
  });

  it("usa o texto configurado, em uma linha só", () => {
    expect(resolveFooterText("  Colégio Erasto Gaertner\n www.erasto.com.br ")).toBe("Colégio Erasto Gaertner www.erasto.com.br");
  });

  it("limita o tamanho", () => {
    expect(normalizeFooterText("x".repeat(500))).toHaveLength(MAX_REPORT_FOOTER_LENGTH);
  });
});
