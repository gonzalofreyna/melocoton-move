import type { NextApiRequest, NextApiResponse } from "next";
import { fetchProducts } from "../../lib/fetchProducts";
import type { Product } from "../../lib/fetchProducts";

type Suggestion = { slug: string; reason: string };
const norm = (s: string) => s.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const value = (p: Product) => p.discountPrice ?? p.fullPrice;
const purchasable = (p: Product) =>
  (p.stock === undefined || p.stock > 0) &&
  Number.isFinite(value(p)) && value(p) > 0 &&
  !/personalizad|a tu medida|con tu logo/i.test([p.name, p.category, ...(p.tags || [])].join(" "));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  res.setHeader("Cache-Control", "no-store");
  const prompt = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 600) : "";
  const budget = Number(req.body?.budget);
  const maxBudget = Number.isFinite(budget) && budget > 0 ? budget : undefined;
  if (prompt.length < 3) return res.status(400).json({ error: "Describe qué necesitas para encontrar productos." });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "El asistente conversacional aún no está habilitado." });

  try {
    const products = (await fetchProducts({ fresh: true }))
      .filter(purchasable)
      .filter((p) => maxBudget === undefined || value(p) <= maxBudget);
    if (products.length === 0) return res.status(200).json({ message: "No encontramos productos disponibles para ese presupuesto.", products: [], source: "catalog" });
    const catalog = products.slice(0, 150).map((p) => ({
      slug: p.slug, name: p.name, category: p.category,
      priceMXN: value(p), tags: (p.tags || []).slice(0, 8),
      highlights: (p.highlights || []).slice(0, 4),
      shippingDays: p.shippingEstimate,
    }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.SHOPPING_ASSISTANT_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Eres asesor de compras de Melocotón Move en México. Devuelve únicamente JSON con claves message (texto breve en español) y suggestions (array de objetos slug, reason). Recomienda hasta 4 productos SOLO del catálogo suministrado, sin inventar artículos, precios, stock, descuentos, garantías o plazos. Si algo exige configuración personal, indica que se hace desde la ficha. Nunca afirmes haber añadido productos al carrito ni solicitado un pago. Respeta un presupuesto TOTAL si existe; si no alcanza, sugiere menos productos." },
            { role: "user", content: JSON.stringify({ request: prompt, totalBudgetMXN: maxBudget ?? null, catalog }) },
          ],
        }),
      });
    } finally { clearTimeout(timer); }
    if (!response.ok) throw new Error(`Error de proveedor ${response.status}`);
    const completion = await response.json();
    const raw = completion?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("Respuesta incompleta");
    const parsed = JSON.parse(raw) as { message?: unknown; suggestions?: unknown };
    const candidates = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const unique = new Set<string>();
    let subtotal = 0;
    const suggestions: Suggestion[] = [];
    for (const item of candidates) {
      if (!item || typeof item.slug !== "string" || unique.has(item.slug)) continue;
      const p = bySlug.get(item.slug);
      if (!p || suggestions.length >= 4) continue;
      if (maxBudget !== undefined && subtotal + value(p) > maxBudget) continue;
      unique.add(item.slug);
      subtotal += value(p);
      suggestions.push({ slug: p.slug, reason: typeof item.reason === "string" ? item.reason.slice(0, 220) : "Puede complementar tu práctica." });
    }
    const safeMessage = typeof parsed.message === "string" ? parsed.message.slice(0, 550) : "Estos productos pueden ayudarte.";
    return res.status(200).json({ message: safeMessage, products: suggestions, source: "assistant" });
  } catch (error) {
    console.error("Shopping assistant request failed", error instanceof Error ? error.message : "unknown");
    return res.status(502).json({ error: "No pudimos generar recomendaciones en este momento. Puedes seguir usando la búsqueda." });
  }
}
