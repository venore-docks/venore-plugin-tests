// Progresso do teste guardado no sessionStorage do navegador: sobrevive a atualizar a página ou
// navegar sem querer, e some ao fechar a aba (de propósito — nome e e-mail ficam no registro, e o
// computador pode ser compartilhado). Tudo em try/catch: o storage pode estar bloqueado/cheio, e a
// página precisa funcionar sem ele.

export type SavedRun = {
  v: 1;
  contextLabel: string;
  participant: { name: string; email: string } | null;
  // Estado do runner do módulo (formato dele; o módulo valida ao restaurar).
  runnerState: unknown;
  // Testes com tempo limite: a tentativa aberta no servidor — retomar NÃO reinicia o cronômetro.
  attemptId?: string | null;
  savedAt: number;
};

// Descarta registros velhos: um teste largado há mais de 3 horas recomeça do zero.
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

export function savedRunKey(moduleId: string, instanceId: string | null): string {
  return `tests:run:${moduleId}:${instanceId ?? "avulso"}`;
}

export function readSavedRun(key: string): SavedRun | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedRun>;
    if (parsed?.v !== 1 || typeof parsed.contextLabel !== "string" || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed as SavedRun;
  } catch {
    return null;
  }
}

export function writeSavedRun(key: string, run: Omit<SavedRun, "v" | "savedAt">): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ v: 1, savedAt: Date.now(), ...run } satisfies SavedRun));
  } catch {
    // sem storage: segue sem retomada.
  }
}

export function clearSavedRun(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // idem.
  }
}
