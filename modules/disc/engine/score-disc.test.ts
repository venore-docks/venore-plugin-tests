import { describe, expect, it } from "vitest";
import { scoreDisc } from "./score-disc";

// Fixtures geradas rodando o algoritmo ORIGINAL de nestpro/components/MoreLess/utility/
// MoreLessResult.tsx (discResult) fora deste repo, não a versão portada aqui — é a única forma de
// provar paridade de verdade. Ver o pedido explícito: "embora você possa refatorar para ganhar
// performance, o resultado deve ser o mesmo".
function buildRawInput(morePattern: string[], lessPattern: string[]) {
  const more: Record<string, string> = {};
  const less: Record<string, string> = {};
  for (let i = 1; i <= 19; i++) {
    more[i] = morePattern[(i - 1) % morePattern.length];
    less[i] = lessPattern[(i - 1) % lessPattern.length];
  }
  return { more, less };
}

describe("scoreDisc — paridade com o NestPro original", () => {
  it("distribui respostas cíclicas entre as quatro letras (caso comum)", () => {
    const rawInput = buildRawInput(["d", "i", "s", "c"], ["c", "s", "i", "d"]);

    expect(scoreDisc(rawInput)).toEqual({
      more: {
        profile: "ic",
        percentual: { d: 53, i: 67, s: 53, c: 67 },
        counted: { d: 5, i: 5, s: 5, c: 4 },
        raw: rawInput.more,
      },
      less: {
        profile: "d",
        percentual: { d: 60, i: 53, s: 52, c: 53 },
        counted: { d: 4, i: 5, s: 5, c: 5 },
        raw: rawInput.less,
      },
      stress: 36,
    });
  });

  it("todas as respostas na mesma letra — extremo que estoura o índice de turnAround (bug preservado do original)", () => {
    const rawInput = buildRawInput(["d"], ["c"]);

    const result = scoreDisc(rawInput);

    expect(result.more).toEqual({
      profile: "d",
      percentual: { d: 103, i: 31, s: 20, c: 38 },
      counted: { d: 19, i: 0, s: 0, c: 0 },
      raw: rawInput.more,
    });
    // counted.less.c = 19 estoura turnAround (tamanho 16) -> NaN, exatamente como no original.
    expect(result.less.profile).toBe("dis");
    expect(result.less.percentual.d).toBe(85);
    expect(result.less.percentual.i).toBe(85);
    expect(result.less.percentual.s).toBe(84);
    expect(result.less.percentual.c).toBeNaN();
    expect(result.stress).toBeNaN();
  });

  it("só respostas neutras ('n') — nenhuma letra DISC contada", () => {
    const rawInput = buildRawInput(["n"], ["n"]);

    expect(scoreDisc(rawInput)).toEqual({
      more: {
        profile: "c",
        percentual: { d: 20, i: 31, s: 20, c: 62 },
        counted: { d: 0, i: 0, s: 0, c: 0 },
        raw: rawInput.more,
      },
      less: {
        profile: "dis",
        percentual: { d: 85, i: 85, s: 84, c: 85 },
        counted: { d: 0, i: 0, s: 0, c: 0 },
        raw: rawInput.less,
      },
      stress: 206,
    });
  });
});
