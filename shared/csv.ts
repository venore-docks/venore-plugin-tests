// CSV para planilha (Excel/Google Sheets). Duas defesas além do escape normal de aspas/vírgulas:
//  - células que começam com = + - @ (ou tab/CR) são "fórmulas" para a planilha: prefixamos com '
//    (injeção de fórmula — o nome/e-mail vem de quem respondeu o teste, não é confiável);
//  - BOM UTF-8 no começo, senão o Excel em português abre os acentos quebrados.

const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
