import type { GetStaticProps } from "next";
import type { Product } from "./fetchProducts";
import type { SeoCategoryProps } from "../components/SeoCategoryPage";

export type SeoCategory = "mats" | "socks";

export function matchesSeoCategory(product: Product, kind: SeoCategory): boolean {
  const category = product.category.toLowerCase();
  const name = product.name.toLowerCase();
  const slug = product.slug.toLowerCase();
  if (kind === "mats") {
    return ["mat", "mats", "tapetes", "tapete"].includes(category) ||
      /^(mat[a-z0-9]|tapete-)/.test(slug) ||
      /tapete|yoga mat/.test(name);
  }
  return ["calcetas", "calcetines", "socks"].includes(category) ||
    /^(basic|curly|calcetines-|calcetas-)/.test(slug) ||
    /calcetines|calcetas/.test(name);
}

export function seoCategoryProps(kind: SeoCategory): GetStaticProps<SeoCategoryProps> {
  return async () => {
    const { fetchProducts } = await import("./fetchProducts");
    const products = await fetchProducts();
    return {
      props: { products: products.filter((product) => matchesSeoCategory(product, kind)) },
      revalidate: 1800,
    };
  };
}
