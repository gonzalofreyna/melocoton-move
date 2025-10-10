// lib/resolveImage.ts
const BASE_ASSETS = "https://melocoton-move-assets.s3.amazonaws.com";

export function resolveImage(src?: string): string {
  // 🔒 Validación: evita errores si src viene vacío o undefined
  if (!src || typeof src !== "string") {
    return ""; // devuelve string vacío para no romper el render
  }

  // 🖼️ Si es una ruta relativa dentro de /images, prepend BASE_ASSETS
  if (src.startsWith("/images/")) {
    return `${BASE_ASSETS}${src}`;
  }

  // 🌍 Si ya es URL absoluta o está lista, se deja tal cual
  return src;
}
