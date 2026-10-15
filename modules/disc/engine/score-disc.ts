// Fórmula portada verbatim de nestpro/components/MoreLess/utility/MoreLessResult.tsx
// (discResult). Requisito explícito da migração: o RESULTADO numérico tem que continuar idêntico
// ao do NestPro — inclusive as excentricidades documentadas abaixo, que são comportamento, não bug
// a corrigir agora. Qualquer refatoração de performance futura precisa manter score-disc.test.ts
// verde (parity fixtures tiradas do sistema antigo).

export type DiscLetter = "d" | "i" | "s" | "c";
export type DiscCount = Record<DiscLetter, number>;
export type RawDiscInput = { more: Record<string, string>; less: Record<string, string> };

export type DiscAxisResult = {
  profile: string;
  percentual: DiscCount;
  counted: DiscCount;
  raw: Record<string, string>;
};

export type DiscScoreResult = {
  more: DiscAxisResult;
  less: DiscAxisResult;
  stress: number | "Carregando...";
};

// O original também tabulava a letra "n" (neutro) dentro de `counted`, mas nunca a lia de volta —
// só d/i/s/c entram nas fórmulas abaixo. Omitido aqui de propósito: não muda nenhum valor exibido
// (percentual/profile/stress), só descarta um campo morto.
function howMany(rawInput: RawDiscInput): { more: DiscCount; less: DiscCount } {
  const count: { more: DiscCount; less: DiscCount } = {
    more: { d: 0, i: 0, s: 0, c: 0 },
    less: { d: 0, i: 0, s: 0, c: 0 },
  };

  Object.values(rawInput.more).forEach((value) => {
    const key = value as DiscLetter;
    if (key in count.more) count.more[key] = (count.more[key] || 0) + 1;
  });
  Object.values(rawInput.less).forEach((value) => {
    const key = value as DiscLetter;
    if (key in count.less) count.less[key] = (count.less[key] || 0) + 1;
  });

  return count;
}

// Parâmetros da curva logística — mesmos nomes e mesmos valores do original, de propósito (não
// renomeei pra facilitar comparação linha a linha com nestpro/.../MoreLessResult.tsx).
const param = { d: 0.29, i: 0.29, s: 0.29, c: 0.29 };
const capExterna = { d: 105, i: 103, s: 105, c: 102 };
const capInterna = { d: 105, i: 105, s: 104, c: 105 };
const goalExterna = { d: 5, i: 2.9, s: 5, c: 1.8 };
const goalInterna = { d: 10, i: 10, s: 10, c: 10 };
const euler = 2.718281828459045;
// Índice por "quantas vezes essa letra foi marcada como MENOS provável" (0..15) -> valor invertido
// usado na curva Interna. 16 posições porque o teste tem 20 perguntas reais (a primeira é a
// versão/cabeçalho, sem opções) e uma letra pode, no limite, aparecer até 15 vezes no lado "less".
const turnAround = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

function logistic(cap: number, paramValue: number, position: number, goal: number): number {
  const positionMinusGoal = position - goal;
  const exponent = -paramValue * positionMinusGoal;
  return cap / (1 + Math.pow(euler, exponent));
}

// Empurra o maior eixo pra um piso "de perfil puro" (66/63/64/62) quando NENHUM eixo passa do
// cutLine — sem isso, um resultado todo abaixo de 60 nunca formaria um profileKey (profile() corta
// tudo abaixo do cutLine). Mantido idêntico ao original, incluindo os valores mágicos por letra.
function applyPureFloor(result: DiscCount): DiscCount {
  const cutLine = 60;
  const max = Math.max(result.d, result.i, result.s, result.c);

  if (result.d < cutLine && result.i < cutLine && result.s < cutLine && result.c < cutLine) {
    return {
      d: Math.round(max === result.d ? result.d + (66 - result.d) : result.d),
      i: Math.round(max === result.i ? result.i + (63 - result.i) : result.i),
      s: Math.round(max === result.s ? result.s + (64 - result.s) : result.s),
      c: Math.round(max === result.c ? result.c + (62 - result.c) : result.c),
    };
  }

  return {
    d: Math.round(result.d),
    i: Math.round(result.i),
    s: Math.round(result.s),
    c: Math.round(result.c),
  };
}

function externa(counted: DiscCount): DiscCount {
  return applyPureFloor({
    d: logistic(capExterna.d, param.d, counted.d, goalExterna.d),
    i: logistic(capExterna.i, param.i, counted.i, goalExterna.i),
    s: logistic(capExterna.s, param.s, counted.s, goalExterna.s),
    c: logistic(capExterna.c, param.c, counted.c, goalExterna.c),
  });
}

function interna(counted: DiscCount): DiscCount {
  return applyPureFloor({
    d: logistic(capInterna.d, param.d, turnAround[counted.d], goalInterna.d),
    i: logistic(capInterna.i, param.i, turnAround[counted.i], goalInterna.i),
    s: logistic(capInterna.s, param.s, turnAround[counted.s], goalInterna.s),
    c: logistic(capInterna.c, param.c, turnAround[counted.c], goalInterna.c),
  });
}

// Adiciona 4/3/2/1 (D/I/S/C) só pra desempatar a ORDENAÇÃO quando dois eixos batem no mesmo
// percentual acima do cutLine — sem isso, D=C=70 poderia ordenar como "Cd" (Experimentador) em vez
// de "Dc" (Independente). Mantido idêntico ao original.
function profileKeyFrom(result: DiscCount): string {
  const cutLine = 60;
  const checkObject = {
    d: result.d >= cutLine ? result.d + 4 : result.d,
    i: result.i >= cutLine ? result.i + 3 : result.i,
    s: result.s >= cutLine ? result.s + 2 : result.s,
    c: result.c >= cutLine ? result.c + 1 : result.c,
  };

  const sorted = Object.entries(checkObject)
    .sort((a, b) => b[1] - a[1])
    .filter(([, value]) => value >= cutLine)
    .map(([key]) => key)
    .join("");

  // Perfis DISC só usam as três letras mais fortes — corta a quarta quando as quatro passam do
  // cutLine.
  return sorted.length >= 4 ? sorted.slice(0, -1) : sorted;
}

function stressOf(a: DiscCount, b: DiscCount): number | "Carregando..." {
  const diffs = [Math.abs(a.d - b.d), Math.abs(a.i - b.i), Math.abs(a.s - b.s), Math.abs(a.c - b.c)];
  if (Number.isNaN(diffs[0])) return "Carregando...";
  return diffs[0] + diffs[1] + diffs[2] + diffs[3];
}

export function scoreDisc(rawInput: RawDiscInput): DiscScoreResult {
  const counted = howMany(rawInput);
  const externaResult = externa(counted.more);
  const internaResult = interna(counted.less);

  return {
    more: {
      profile: profileKeyFrom(externaResult),
      percentual: externaResult,
      counted: counted.more,
      raw: rawInput.more,
    },
    less: {
      profile: profileKeyFrom(internaResult),
      percentual: internaResult,
      counted: counted.less,
      raw: rawInput.less,
    },
    stress: stressOf(externaResult, internaResult),
  };
}
