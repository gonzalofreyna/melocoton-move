// lib/fetchProducts.ts
export type DimensionsCm = { w: number; h: number; l: number };
export type ShippingEstimate = {
  minBusinessDays: number;
  maxBusinessDays: number;
};

export type Product = {
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
  freeShipping?: boolean;
  stock?: number;
  weightGrams?: number;
  dimensionsCm?: DimensionsCm;
  shippingEstimate?: ShippingEstimate;
  brand?: string;
  sku?: string;
  materials?: string[];
  care?: string[];
  highlights?: string[];
  whatsIncluded?: string[];
  returnDays?: number;
  warrantyMonths?: number;
  tags?: string[];
  related?: string[];
};

const API_PRODUCTS_URL = process.env.NEXT_PUBLIC_API_PRODUCTS_URL!;
if (!API_PRODUCTS_URL) {
  throw new Error("Falta NEXT_PUBLIC_API_PRODUCTS_URL");
}

// ⚡️ NUEVO: cache en memoria y dedupe
let cache: Product[] | null = null;
let inFlight: Promise<Product[]> | null = null;
// 🕒 Valor que cambia cada 30 minutos → invalida caché automáticamente
const VERSION_KEY = Math.floor(Date.now() / (30 * 60 * 1000));

export async function fetchProducts(): Promise<Product[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const url = `${API_PRODUCTS_URL}?v=${VERSION_KEY}`;
    console.log("♻️ Fetching products from", url);
    const res = await fetch(url, { cache: "no-store" });
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
      const merged = main ? [main, ...arr] : arr;
      const seen = new Set<string>();
      return merged.filter((u) => {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });
    };

    const products = (Array.isArray(raw) ? raw : []).map((p: any): Product => {
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
        brand: toStr(p?.brand),
        sku: toStr(p?.sku),
        materials: toStrArr(p?.materials),
        care: toStrArr(p?.care),
        highlights: toStrArr(p?.highlights),
        whatsIncluded: toStrArr(p?.whatsIncluded),
        returnDays: toInt(p?.returnDays),
        warrantyMonths: toInt(p?.warrantyMonths),
        tags: toStrArr(p?.tags),
        related: toStrArr(p?.related),
      };
    });

    cache = products;
    inFlight = null;
    return products;
  })();

  return inFlight;
}
