import type { GetStaticProps } from "next";
import type { Product } from "./fetchProducts";
import type { SeoCategoryProps } from "../components/SeoCategoryPage";

export type SeoCategory = "mats" | "socks";

export function matchesSeoCategory(product: Product, kind: SeoCategory): boolean {
  const category = product.category.trim().toLowerCase();
  return category === (kind === "mats" ? "mat" : "calcetas");
}

export function seoCategoryProps(kind: SeoCategory): GetStaticProps<SeoCategoryProps> {
  return async () => {
    const { fetchProducts } = await import("./fetchProducts");
    const products = await fetchProducts();
    return {
      props: { products: JSON.parse(JSON.stringify(products.filter((product) => matchesSeoCategory(product, kind)))) as Product[] },
      revalidate: 1800,
    };
  };
}
