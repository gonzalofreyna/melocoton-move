import SeoCategoryPage from "../components/SeoCategoryPage";
import type { SeoCategoryProps } from "../components/SeoCategoryPage";
import { seoCategoryProps } from "../lib/seoCategories";

export const getStaticProps = seoCategoryProps("mats");

export default function TapetesYogaPilates({ products }: SeoCategoryProps) {
  return <SeoCategoryPage
    products={products}
    title="Tapetes de Yoga y Pilates | Melocotón Move"
    description="Explora tapetes de yoga y Pilates Melocotón Move. Descubre diseños para acompañar tu práctica y elige tu favorito."
    heading="Tapetes de Yoga y Pilates"
    intro="Encuentra un tapete para acompañar tus sesiones de yoga y Pilates. Explora los diseños disponibles en Melocotón Move."
    canonicalPath="/tapetes-yoga-pilates"
  />;
}
