// Portado de nestpro/components/MoreLess/utility/ShuffleObject.ts (Fisher-Yates in-place) — usado
// pra embaralhar a ordem das opções de cada pergunta a cada exibição, mesmo comportamento visual
// do original.
export function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
