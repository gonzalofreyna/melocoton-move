import type { NextApiRequest, NextApiResponse } from "next";
import { fetchProducts } from "../../lib/fetchProducts";
import type { Product } from "../../lib/fetchProducts";
import { resolveImage } from "../../lib/resolveImage";

const SITE = "https://www.melocotonmove.com";
const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const xmlNode = (tag: string, value: string) => `<g:${tag}>${xmlEscape(value)}</g:${tag}>`;
const absoluteImage = (value: string) => {
  const resolved = resolveImage(value);
  if (!resolved) return null;
  try {
    const url = new URL(resolved, SITE);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
};

export function buildMerchantFeed(products: Product[]) {
  const excluded = { missingStock: 0, customShipping: 0, invalid: 0 };
  const seen = new Set<string>();
  const isReformer = (p: Product) => /reformer/i.test([p.name, p.slug, p.category].join(" "));
  const entries: string[] = [];

  for (const p of products) {
    // Never claim availability where the inventory source does not specify it.
    if (p.stock == null || !Number.isInteger(p.stock) || p.stock < 0) {
      excluded.missingStock++;
      continue;
    }
    // Custom shipping is quoted separately; do not imply a standard checkout delivery.
    if (p.shippingType === "custom" || isReformer(p)) {
      excluded.customShipping++;
      continue;
    }

    const image = absoluteImage(p.image);
    const price = Number(p.fullPrice);
    const offer = Number(p.discountPrice);
    const id = (p.sku || p.slug || "").trim();
    if (!id || seen.has(id) || !p.name?.trim() || !p.description?.trim() ||
        !p.slug?.trim() || !image || !Number.isFinite(price) || price <= 0) {
      excluded.invalid++;
      continue;
    }
    // Merchant shipping groups use the delivery TOTAL from the database.
    // Google Merchant Center must be configured so handling + transit equals
    // this total; the feed does not invent a separate carrier transit time.
    const estimate = p.shippingEstimate;
    const minDays = estimate?.minBusinessDays;
    const maxDays = estimate?.maxBusinessDays;
    if (!Number.isInteger(minDays) || !Number.isInteger(maxDays) ||
        minDays == null || maxDays == null || minDays < 0 || maxDays < minDays) {
      excluded.invalid++;
      continue;
    }
    // A shipping label is not a promise of free shipping.
        const shippingLabel = `${p.freeShipping === true ? "promo-elegible" : "estandar"}-entrega-${minDays}-${maxDays}-habiles`;
        const weight = Number(p.weightGrams);
        const dims = p.dimensionsCm;
        const hasValidWeight = Number.isFinite(weight) && weight > 0;
        const hasValidDimensions = dims != null && [dims.w, dims.h, dims.l].every((n) => Number.isFinite(n) && n > 0);
    seen.add(id);
    const hasSale = Number.isFinite(offer) && offer > 0 && offer < price;
    const link = new URL("/" + encodeURIComponent(p.slug), SITE).toString();
    const additionalImages = [...new Set((p.gallery || []).map(absoluteImage).filter((url): url is string => Boolean(url)))]
      .filter((url) => url !== image).slice(0, 10);
    const item = [
      xmlNode("id", id),
      xmlNode("title", p.name),
      xmlNode("description", p.description),
      xmlNode("link", link),
      xmlNode("image_link", image),
      ...additionalImages.map((url) => xmlNode("additional_image_link", url)),
      xmlNode("availability", p.stock === 0 ? "out_of_stock" : "in_stock"),
      xmlNode("condition", "new"),
      xmlNode("shipping_label", shippingLabel),
      // Shipping prices are set in Merchant Center after matching Skydropx checkout.
      // Never advertise a flat rate or unconditional free shipping here.
      ...(hasValidWeight ? [xmlNode("shipping_weight", `${weight} g`)] : []),
      ...(hasValidDimensions ? [
        xmlNode("shipping_width", `${dims!.w} cm`),
        xmlNode("shipping_height", `${dims!.h} cm`),
        xmlNode("shipping_length", `${dims!.l} cm`),
      ] : []),
      xmlNode("price", price.toFixed(2) + " MXN"),
      ...(hasSale ? [xmlNode("sale_price", offer.toFixed(2) + " MXN")] : []),
      xmlNode("brand", p.brand?.trim() || "Melocotón Move"),
      ...(p.category?.trim() ? [xmlNode("product_type", p.category)] : []),
    ];
    entries.push("<item>" + item.join("") + "</item>");
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>' +
    "<title>Melocotón Move</title><link>" + SITE + "</link>" +
    "<description>Catálogo de productos Melocotón Move</description>" +
    entries.join("") + "</channel></rss>";
  return { xml, included: entries.length, excluded };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  try {
    const products = await fetchProducts({ fresh: true });
    const feed = buildMerchantFeed(products);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=300");
    res.setHeader("X-Merchant-Items", String(feed.included));
    if (req.method === "HEAD") return res.status(200).end();
    return res.status(200).send(feed.xml);
  } catch (error) {
    console.error("Merchant Center feed generation failed:", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Feed temporalmente no disponible");
  }
}
