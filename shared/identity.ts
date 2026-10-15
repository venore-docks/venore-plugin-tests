// Identificação de quem responde SEM login (nome + e-mail). O e-mail normalizado é a chave de
// "uma resposta por pessoa por instância" e do casamento da mesma pessoa entre instâncias.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const value = email.trim();
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export type ParticipantInput = { name?: string | null; email?: string | null };

export type ParticipantValidation =
  | { ok: true; name: string; email: string; emailKey: string }
  | { ok: false; code: string; message: string };

export function validateParticipant(input: ParticipantInput | null | undefined): ParticipantValidation {
  const name = (input?.name ?? "").trim().replace(/\s+/g, " ");
  const email = (input?.email ?? "").trim();
  if (name.length < 2 || name.length > 120) {
    return { ok: false, code: "invalid_name", message: "Informe seu nome (de 2 a 120 caracteres)." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, code: "invalid_email", message: "Informe um e-mail válido." };
  }
  return { ok: true, name, email, emailKey: normalizeEmail(email) };
}

export function validateContextLabel(value: string | null | undefined): { ok: true; value: string } | { ok: false; code: string; message: string } {
  const label = (value ?? "").trim().replace(/\s+/g, " ");
  if (label.length < 2 || label.length > 120) {
    return { ok: false, code: "invalid_context", message: "Descreva o contexto em que você vai responder (de 2 a 120 caracteres)." };
  }
  return { ok: true, value: label };
}
