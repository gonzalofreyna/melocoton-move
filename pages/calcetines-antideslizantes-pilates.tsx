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
    faqs={[
      { question: "¿Para qué sirven las calcetas antideslizantes de Pilates?", answer: "Su superficie de agarre en la planta del pie ayuda a reducir el deslizamiento durante los movimientos sobre superficies de práctica. No sustituye una técnica adecuada ni garantiza evitar caídas." },
      { question: "¿Se pueden usar para Pilates reformer y barre?", answer: "Sí. Las calcetas antideslizantes son una opción habitual para Pilates de piso, reformer y barre. Revisa los requisitos de tu estudio antes de asistir a clase." },
      { question: "¿Qué talla tienen las calcetas de Melocotón Move?", answer: "Todas nuestras calcetas antideslizantes son unitalla. Consulta las fotografías y detalles de cada modelo para conocer su diseño." },
      { question: "¿Qué modelos y colores están disponibles?", answer: "Puedes explorar los modelos Basic y Curly y sus variantes de color en esta página. La disponibilidad de cada variante se muestra en su ficha de producto." },
    ]}
    guide={{ href: "/guia-calcetas-antideslizantes-pilates", title: "Guía para elegir tus calcetas", description: "Conoce qué revisar sobre agarre, ajuste y modelos para Pilates, reformer y barre." }}
    canonicalPath="/calcetines-antideslizantes-pilates"
  />;
}
