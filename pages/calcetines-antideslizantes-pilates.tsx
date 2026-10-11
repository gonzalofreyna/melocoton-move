import SeoCategoryPage from "../components/SeoCategoryPage";
import type { SeoCategoryProps } from "../components/SeoCategoryPage";
import { seoCategoryProps } from "../lib/seoCategories";

export const getStaticProps = seoCategoryProps("socks");

export default function CalcetinesPilates({ products }: SeoCategoryProps) {
  return <SeoCategoryPage
    products={products}
    title="Calcetines Antideslizantes para Pilates | Melocotón Move"
    description="Descubre calcetines antideslizantes y calcetas antiderrapantes para Pilates. Explora diseños y colores de Melocotón Move."
    heading="Calcetines Antideslizantes para Pilates"
    intro="Descubre calcetines para Pilates en diferentes diseños y colores, pensados para acompañar tu práctica."
    canonicalPath="/calcetines-antideslizantes-pilates"
  />;
}
