import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

const logos = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/logos/*.{jpeg,jpg,png,gif,webp}',
  { eager: true },
);

function globKeyFromSrc(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  const file = decodeURIComponent(trimmed.replace(/^\//, '').split(/[?#]/)[0] ?? '');
  if (!file || file.includes('..') || file.includes('/')) return null;
  return `/src/assets/logos/${file}`;
}

export function vendorLogoAsset(src?: string | null): ImageMetadata | undefined {
  if (!src) return undefined;
  const key = globKeyFromSrc(src);
  return key ? logos[key]?.default : undefined;
}

/** Optimized 2x WebP URL for above-the-fold vendor logos (`<link rel="preload">`). */
export async function vendorLogoPreloadHref(
  src?: string | null,
  cssSize = 40,
): Promise<string | undefined> {
  const meta = vendorLogoAsset(src);
  if (!meta) return undefined;
  const img = await getImage({
    src: meta,
    width: cssSize,
    height: cssSize,
    format: 'webp',
    densities: [1, 2],
  });
  const twoX = img.srcSet.values.find((value) => value.descriptor === '2x')?.url;
  return twoX ?? img.src;
}
