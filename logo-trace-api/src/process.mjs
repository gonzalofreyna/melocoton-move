import sharp from "sharp";
import potrace from "potrace";
import { promisify } from "node:util";
const trace = promisify(potrace.trace);
const MAX_BYTES = 5 * 1024 * 1024;

export async function traceLogo(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_BYTES) throw new Error("Archivo demasiado grande o vacío");
  const metadata = await sharp(bytes, { limitInputPixels: 16_000_000 }).metadata();
  if (!["jpeg","png","webp"].includes(metadata.format)) throw new Error("Formato no admitido");
  if (!metadata.width || !metadata.height) throw new Error("Imagen inválida");
  const normalized = await sharp(bytes).rotate().resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true})
    .flatten({background:"#ffffff"}).grayscale().png().toBuffer();
  const { data } = await sharp(normalized).raw().toBuffer({resolveWithObject:true});
  let dark=0;
  for(let i=0;i<data.length;i++) if(data[i]<180) dark++;
  const ratio=dark/data.length;
  if(ratio<0.001 || ratio>0.85) throw new Error("No se distinguen trazos suficientes");
  const svg = await trace(normalized, {turdSize:3, alphaMax:1, optCurve:true, optTolerance:0.25, threshold:180, blackOnWhite:true});
  if(typeof svg!=="string" || !svg.includes("<path") || svg.length>1_500_000) throw new Error("El logo requiere revisión");
  const png=await sharp(Buffer.from(svg)).png().toBuffer();
  return {svg,previewPng:png.toString("base64"),mimeType:"image/png",warnings:[]};
}
