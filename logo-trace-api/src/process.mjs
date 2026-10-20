import sharp from "sharp";
import potrace from "potrace";

const MAX_BYTES = 5 * 1024 * 1024;

// Potrace trabaja directamente sobre los píxeles; no normalizamos contraste ni
// hacemos una segunda limpieza que pueda cerrar los huecos de las letras.
function bitmapTrace(png) {
  return new Promise((resolve, reject) => {
    potrace.trace(png, {
      threshold: 180,
      blackOnWhite: true,
      turdSize: 0,
      optCurve: true,
      optTolerance: 0.2,
    }, (error, svg) => error ? reject(error) : resolve(svg));
  });
}

export async function traceLogo(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_BYTES)
    throw new Error("Archivo vacío o mayor de 5 MB");

  const metadata = await sharp(bytes, { limitInputPixels: 16_000_000 }).metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format))
    throw new Error("Formato no admitido");
  if (!metadata.width || !metadata.height) throw new Error("Imagen inválida");

  const png = await sharp(bytes, { limitInputPixels: 16_000_000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();

  const svg = await bitmapTrace(png);
  if (typeof svg !== "string" || !svg.includes("<path"))
    throw new Error("No se encontraron trazos en la imagen");
  if (svg.length > 1_500_000) throw new Error("El trazado es demasiado complejo");

  // Volver a rasterizar el SVG con transparencia para la vista previa.
  const previewPng = await sharp(Buffer.from(svg)).png().toBuffer();
  return { svg, previewPng: previewPng.toString("base64"), mimeType: "image/png", warnings: [] };
}
