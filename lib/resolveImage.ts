// lib/resolveImage.ts
const BASE_ASSETS = "https://melocoton-move-assets.s3.amazonaws.com";

export function resolveImage(src: string) {
  if (src.startsWith("/images/")) {
    return `${BASE_ASSETS}${src}`;
  }
  return src; // Si en el futuro ya viene completa, la dejamos como está
}
