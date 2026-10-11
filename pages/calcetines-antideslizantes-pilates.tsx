import SeoCategoryPage from "../components/SeoCategoryPage";
import type { SeoCategoryProps } from "../components/SeoCategoryPage";
import { seoCategoryProps } from "../lib/seoCategories";

export const getStaticProps = seoCategoryProps("socks");

export default function CalcetinesPilates({ products }: SeoCategoryProps) {
  return <SeoCategoryPage
    products={products}
    title="Calcetines Antideslizantes para Pilates | Melocotón Move"
    description="Compra calcetas antideslizantes para Pilates, barre y reformer. Explora modelos con agarre en la planta, 80% algodón y distintos colores."
    heading="Calcetines Antideslizantes para Pilates"
    intro="Explora calcetas antideslizantes para Pilates, barre y reformer, diseñadas para ofrecer agarre durante tus movimientos. Conoce nuestros modelos y elige el color que acompaña tu práctica."
    contentSections={[
      { heading: "¿Para qué sirven las calcetas antideslizantes?", body: "El agarre en la planta del pie ayuda a mantener contacto con la superficie de práctica durante movimientos de Pilates, barre y reformer. Elige un modelo que se ajuste cómodamente a tu pie." },
      { heading: "Elige tus calcetas para Pilates", body: "Descubre modelos, colores y texturas para combinar con tu estilo. Consulta las fotografías y especificaciones de cada producto para comparar detalles antes de comprar." },
    ]}
    canonicalPath="/calcetines-antideslizantes-pilates"
  />;
}
