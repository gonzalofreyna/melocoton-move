import SeoCategoryPage from "../components/SeoCategoryPage";
import type { SeoCategoryProps } from "../components/SeoCategoryPage";
import { seoCategoryProps } from "../lib/seoCategories";

export const getStaticProps = seoCategoryProps("mats");

export default function TapetesYogaPilates({ products }: SeoCategoryProps) {
  return <SeoCategoryPage
    products={products}
    title="Tapetes de Yoga y Pilates | Melocotón Move"
    description="Compra tapetes de yoga y Pilates de caucho natural y poliuretano, con 5 mm de grosor y opciones personalizables. Descubre Melocotón Move."
    heading="Tapetes de Yoga y Pilates"
    intro="Descubre tapetes para yoga y Pilates con una superficie de poliuretano de alto grado y base de caucho natural. Explora nuestros colores y diseños para practicar en casa o en estudio."
    canonicalPath="/tapetes-yoga-pilates"
  />;
}
