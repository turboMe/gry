// ═══════════════════════════════════════════════════════════
//  SHUFFLE UTILITY
//  Fisher-Yates shuffle that preserves original indices.
// ═══════════════════════════════════════════════════════════

export interface ShuffledItem<T> {
  item: T;
  originalIndex: number;
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 * Returns a new array with items in random order,
 * each tagged with its original index for scoring.
 */
export function shuffleWithOriginalIndices<T>(arr: readonly T[]): ShuffledItem<T>[] {
  const tagged = arr.map((item, i) => ({ item, originalIndex: i }));

  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
  }

  return tagged;
}
