import { describe, expect, it } from "vitest";
import { compareResults, type ComparableResult } from "./match";

function result(partial: Partial<ComparableResult> & { id: string; label: string }): ComparableResult {
  return { userId: null, participantName: null, participantEmail: null, participantEmailKey: null, ...partial };
}

describe("compareResults — mesma equipe em dois momentos", () => {
  it("casa a mesma pessoa pelo e-mail normalizado e marca quem mudou", () => {
    const first = [
      result({ id: "1", label: "Persistente (Sc)", participantName: "Maria", participantEmail: "Maria@X.com", participantEmailKey: "maria@x.com" }),
      result({ id: "2", label: "Avaliador (Ci)", participantName: "João", participantEmail: "joao@x.com", participantEmailKey: "joao@x.com" }),
    ];
    const second = [
      result({ id: "3", label: "Persistente (Sc)", participantName: "Maria S.", participantEmail: "maria@x.com", participantEmailKey: "maria@x.com" }),
      result({ id: "4", label: "Mediador (Dic)", participantName: "João", participantEmail: "joao@x.com", participantEmailKey: "joao@x.com" }),
    ];

    const comparison = compareResults(first, second);

    expect(comparison.matched).toBe(2);
    expect(comparison.changed).toBe(1);
    expect(comparison.rows.map((row) => [row.who, row.changed])).toEqual([
      ["João", true],
      ["Maria", false],
    ]);
  });

  it("quem respondeu só em um dos momentos aparece com o outro lado vazio", () => {
    const comparison = compareResults(
      [result({ id: "1", label: "A", participantName: "Ana", participantEmailKey: "ana@x.com" })],
      [result({ id: "2", label: "B", participantName: "Bia", participantEmailKey: "bia@x.com" })],
    );

    expect(comparison.matched).toBe(0);
    expect(comparison.rows).toEqual([
      { who: "Ana", a: "A", b: null, changed: false },
      { who: "Bia", a: null, b: "B", changed: false },
    ]);
  });

  it("casa por conta quando respondeu logado e conta o que não dá para casar", () => {
    const comparison = compareResults(
      [result({ id: "1", label: "X", userId: "u1" }), result({ id: "9", label: "sem identificação" })],
      [result({ id: "2", label: "Y", userId: "u1" })],
    );

    expect(comparison.matched).toBe(1);
    expect(comparison.changed).toBe(1);
    expect(comparison.unmatchedA).toBe(1);
    expect(comparison.unmatchedB).toBe(0);
  });
});
