// lib/fetchProducts.ts
export type Product = {
  name: string;
  slug: string;
  image: string; // ejemplo: "/images/aro.jpeg"
  fullPrice: number;
  discountPrice?: number;
  colors: string[];
  category: string;
  featured: boolean;
  description: string;
};

const S3_JSON_URL =
  "https://melocoton-move-assets.s3.amazonaws.com/products.json";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(S3_JSON_URL, {
    cache: "no-store", // para que siempre traiga la última versión
  });
  if (!res.ok) {
    throw new Error(`Error cargando productos: ${res.status}`);
  }
  return res.json();
}
