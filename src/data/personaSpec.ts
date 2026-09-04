import type { FeatureSpec } from '../types/comparison';

/** Typed capability helper used by every persona pack. */
export function spec(supported: boolean, detail: string): FeatureSpec {
  return { supported, spec: detail };
}

export function mergeSpec(a: FeatureSpec, b: FeatureSpec, aName: string, bName: string): FeatureSpec {
  return {
    supported: a.supported || b.supported,
    spec: `${aName}: ${a.spec} ${bName}: ${b.spec}`,
  };
}

export function mergeFeatureMap<T extends Record<string, FeatureSpec>>(
  a: T,
  b: T,
  aName: string,
  bName: string
): T {
  const merged = { ...a };
  for (const key of Object.keys(a) as Array<keyof T>) {
    merged[key] = mergeSpec(a[key], b[key], aName, bName) as T[keyof T];
  }
  return merged;
}

/**
 * Merge two persona packs (startupFeatures, scaleupFeatures, …). Each value is
 * a FeatureSpec map; unknown keys on `b` are ignored and missing keys throw
 * at mergeSpec when a capability is undefined.
 */
export function mergePersonaPack<T extends object>(a: T, b: T, aName: string, bName: string): T {
  const merged = { ...a };
  for (const key of Object.keys(a) as Array<keyof T>) {
    merged[key] = mergeFeatureMap(
      a[key] as Record<string, FeatureSpec>,
      b[key] as Record<string, FeatureSpec>,
      aName,
      bName
    ) as T[keyof T];
  }
  return merged;
}
