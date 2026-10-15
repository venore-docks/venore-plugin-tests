import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail, validateContextLabel, validateParticipant } from "./identity";

describe("identificação de quem responde sem login", () => {
  it("normaliza o e-mail (minúsculo, sem espaços) — chave de uma resposta por pessoa", () => {
    expect(normalizeEmail("  Maria.Silva@Empresa.COM ")).toBe("maria.silva@empresa.com");
  });

  it("valida formato de e-mail", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("sem-arroba")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail(`${"x".repeat(250)}@a.com`)).toBe(false);
  });

  it("aceita nome e e-mail válidos e devolve a chave normalizada", () => {
    const result = validateParticipant({ name: "  Maria   da Silva ", email: " Maria@Empresa.com " });
    expect(result).toEqual({ ok: true, name: "Maria da Silva", email: "Maria@Empresa.com", emailKey: "maria@empresa.com" });
  });

  it("recusa nome curto demais, vazio ou ausente", () => {
    expect(validateParticipant({ name: "M", email: "a@b.co" })).toMatchObject({ ok: false, code: "invalid_name" });
    expect(validateParticipant({ name: "", email: "a@b.co" })).toMatchObject({ ok: false, code: "invalid_name" });
    expect(validateParticipant(null)).toMatchObject({ ok: false, code: "invalid_name" });
  });

  it("recusa e-mail inválido", () => {
    expect(validateParticipant({ name: "Maria", email: "maria" })).toMatchObject({ ok: false, code: "invalid_email" });
  });

  it("valida o contexto (2 a 120 caracteres, espaços colapsados)", () => {
    expect(validateContextLabel("  No   trabalho ")).toEqual({ ok: true, value: "No trabalho" });
    expect(validateContextLabel("a")).toMatchObject({ ok: false, code: "invalid_context" });
    expect(validateContextLabel(null)).toMatchObject({ ok: false, code: "invalid_context" });
    expect(validateContextLabel("x".repeat(121))).toMatchObject({ ok: false, code: "invalid_context" });
  });
});
