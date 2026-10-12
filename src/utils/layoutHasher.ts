/** Deterministic layout hashing so comparison routes do not share one DOM order. */

export function getSlugHash(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function selectLayoutVariant(slug: string, optionsCount: number = 3): number {
  return getSlugHash(slug) % optionsCount;
}

export function orderByHash<T>(slug: string, items: T[]): T[] {
  const copy = [...items];
  let seed = getSlugHash(slug) || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
