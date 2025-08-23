// lib/fetchProducts.ts
export type DimensionsCm = { w: number; h: number; l: number };
export type ShippingEstimate = {
  minBusinessDays: number;
  maxBusinessDays: number;
};

export type Product = {
  // básicos
  name: string;
  slug: string;
  image: string;
  gallery?: string[];
  fullPrice: number;
  discountPrice?: number;
  colors: string[];
  category: string;
  featured: boolean;
  description: string;

  // flags y logística
  freeShipping?: boolean;
  stock?: number; // piezas disponibles
  weightGrams?: number;
  dimensionsCm?: DimensionsCm;
  shippingEstimate?: ShippingEstimate;

  // marca / sku / atributos
  brand?: string;
  sku?: string;
  materials?: string[];
  care?: string[];
  highlights?: string[];
  whatsIncluded?: string[];
  returnDays?: number;
  warrantyMonths?: number;

  // meta
  tags?: string[];
  related?: string[];
};

const S3_JSON_URL =
  process.env.NEXT_PUBLIC_PRODUCTS_JSON_URL ||
  "https://melocoton-move-assets.s3.amazonaws.com/products.json";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(S3_JSON_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error cargando productos: ${res.status}`);

  const raw = await res.json();

  const toNum = (v: any): number | undefined => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const toInt = (v: any): number | undefined => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const toStr = (v: any): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const toStrArr = (v: any): string[] =>
    Array.isArray(v)
      ? v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
      : [];

  const toGallery = (img: string, g: any): string[] => {
    const main = toStr(img);
    const arr = toStrArr(g);
    // Ponemos image como primera si no está, y deduplicamos preservando orden
    const merged = main ? [main, ...arr] : arr;
    const seen = new Set<string>();
    return merged.filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  };

  return (Array.isArray(raw) ? raw : []).map((p: any): Product => {
    const name = toStr(p?.name) || "Producto";
    const slug =
      toStr(p?.slug) ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const image = toStr(p?.image) || "/images/placeholder.png";

    const fullPrice = toNum(p?.fullPrice) ?? 0;
    const discountPrice = toNum(p?.discountPrice);
    const colors = toStrArr(p?.colors);
    const category = toStr(p?.category) || "general";
    const featured = Boolean(p?.featured);
    const description = toStr(p?.description) || "";

    return {
      // básicos
      name,
      slug,
      image,
      gallery: toGallery(image, p?.gallery),
      fullPrice,
      discountPrice:
        discountPrice && discountPrice > 0 && discountPrice < fullPrice
          ? discountPrice
          : undefined,
      colors,
      category,
      featured,
      description,

      // flags y logística
      freeShipping: p?.freeShipping === true,
      stock: toInt(p?.stock),
      weightGrams: toNum(p?.weightGrams),
      dimensionsCm:
        p?.dimensionsCm &&
        typeof p.dimensionsCm === "object" &&
        toNum(p.dimensionsCm.w) != null &&
        toNum(p.dimensionsCm.h) != null &&
        toNum(p.dimensionsCm.l) != null
          ? {
              w: Number(p.dimensionsCm.w),
              h: Number(p.dimensionsCm.h),
              l: Number(p.dimensionsCm.l),
            }
          : undefined,
      shippingEstimate:
        p?.shippingEstimate &&
        toInt(p.shippingEstimate.minBusinessDays) != null &&
        toInt(p.shippingEstimate.maxBusinessDays) != null
          ? {
              minBusinessDays: Number(p.shippingEstimate.minBusinessDays),
              maxBusinessDays: Number(p.shippingEstimate.maxBusinessDays),
            }
          : undefined,

      // marca / sku / atributos
      brand: toStr(p?.brand),
      sku: toStr(p?.sku),
      materials: toStrArr(p?.materials),
      care: toStrArr(p?.care),
      highlights: toStrArr(p?.highlights),
      whatsIncluded: toStrArr(p?.whatsIncluded),
      returnDays: toInt(p?.returnDays),
      warrantyMonths: toInt(p?.warrantyMonths),

      // meta
      tags: toStrArr(p?.tags),
      related: toStrArr(p?.related),
    };
  });
}
