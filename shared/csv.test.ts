import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv } from "./csv";

describe("csv", () => {
  it("não altera texto simples e trata nulos como vazio", () => {
    expect(escapeCsvCell("Maria")).toBe("Maria");
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
    expect(escapeCsvCell(42)).toBe("42");
  });

  it("escapa aspas, vírgulas, ponto e vírgula e quebras de linha", () => {
    expect(escapeCsvCell('Ana "Anita", Silva')).toBe('"Ana ""Anita"", Silva"');
    expect(escapeCsvCell("a;b")).toBe('"a;b"');
    expect(escapeCsvCell("linha1\nlinha2")).toBe('"linha1\nlinha2"');
  });

  it("neutraliza injeção de fórmula (nome vem de quem respondeu o teste)", () => {
    expect(escapeCsvCell("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
    expect(escapeCsvCell("+55 41 99999")).toBe("'+55 41 99999");
    expect(escapeCsvCell("-1+1")).toBe("'-1+1");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("monta o arquivo com BOM e linhas CRLF", () => {
    const csv = toCsv(["Nome", "E-mail"], [["Maria", "m@x.com"], ["João", null]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿Nome,E-mail\r\nMaria,m@x.com\r\nJoão,\r\n");
  });
});
