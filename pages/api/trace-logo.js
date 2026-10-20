import { traceLogo } from "../../logo-trace-api/src/process.mjs";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "12mb",
  },
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }
  const type = (req.headers["content-type"] || "").split(";")[0].toLowerCase();
  if (!["image/png", "image/jpeg", "image/webp"].includes(type)) {
    return res.status(415).json({ error: "Sube una imagen PNG, JPG o WEBP" });
  }
  const maxBytes = 5 * 1024 * 1024;
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBytes) return res.status(413).json({ error: "El archivo debe pesar menos de 5 MB" });
      chunks.push(chunk);
    }
    const result = await traceLogo(Buffer.concat(chunks));
    return res.status(200).json({ previewPng: result.previewPng });
  } catch (error) {
    console.error("Error al trazar logo:", error);
    return res.status(422).json({ error: "No pudimos preparar este logo. Revisa su contraste e inténtalo de nuevo." });
  }
}
