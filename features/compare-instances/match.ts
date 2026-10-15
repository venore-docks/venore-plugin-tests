// Casamento de pessoas entre duas aplicações da mesma equipe (ex.: 1º e 2º trimestre). A chave é o
// e-mail normalizado de quem respondeu sem login ou, para quem respondeu logado, a conta. Quem não
// tem nenhuma das duas (resposta antiga sem identificação) não dá para casar: entra só nas
// contagens "só em A" / "só em B".

export type ComparableResult = {
  id: string;
  userId: string | null;
  participantName: string | null;
  participantEmail: string | null;
  participantEmailKey: string | null;
  label: string;
};

export type ComparisonRow = {
  who: string;
  a: string | null;
  b: string | null;
  // Está nas duas e o resultado mudou.
  changed: boolean;
};

export type Comparison = {
  rows: ComparisonRow[];
  matched: number;
  changed: number;
  unmatchedA: number;
  unmatchedB: number;
};

function matchKey(result: ComparableResult): string | null {
  if (result.participantEmailKey) return `email:${result.participantEmailKey}`;
  if (result.userId) return `user:${result.userId}`;
  return null;
}

function displayName(result: ComparableResult): string {
  return result.participantName ?? result.participantEmail ?? "Participante";
}

export function compareResults(a: ComparableResult[], b: ComparableResult[]): Comparison {
  const byKeyA = new Map<string, ComparableResult>();
  const byKeyB = new Map<string, ComparableResult>();
  let unmatchedA = 0;
  let unmatchedB = 0;

  for (const result of a) {
    const key = matchKey(result);
    if (key) byKeyA.set(key, result);
    else unmatchedA += 1;
  }
  for (const result of b) {
    const key = matchKey(result);
    if (key) byKeyB.set(key, result);
    else unmatchedB += 1;
  }

  const rows: ComparisonRow[] = [];
  for (const key of new Set([...byKeyA.keys(), ...byKeyB.keys()])) {
    const left = byKeyA.get(key);
    const right = byKeyB.get(key);
    rows.push({
      who: displayName((left ?? right) as ComparableResult),
      a: left?.label ?? null,
      b: right?.label ?? null,
      changed: Boolean(left && right && left.label !== right.label),
    });
  }
  rows.sort((first, second) => first.who.localeCompare(second.who, "pt-BR"));

  return {
    rows,
    matched: rows.filter((row) => row.a !== null && row.b !== null).length,
    changed: rows.filter((row) => row.changed).length,
    unmatchedA,
    unmatchedB,
  };
}
