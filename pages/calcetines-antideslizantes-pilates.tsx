import SeoCategoryPage from "../components/SeoCategoryPage";
import type { SeoCategoryProps } from "../components/SeoCategoryPage";
import { seoCategoryProps } from "../lib/seoCategories";

export const getStaticProps = seoCategoryProps("socks");

export default function CalcetinesPilates({ products }: SeoCategoryProps) {
  return <SeoCategoryPage
    products={products}
    title="Calcetas Antideslizantes para Pilates | Melocotón Move México"
    description="Compra en México calcetas antideslizantes Melocotón Move para Pilates reformer, piso y barre. Modelos Basic y Curly, ajuste unitalla y distintos colores."
    heading="Calcetas antideslizantes para Pilates, reformer y barre"
    intro="Compra en línea calcetas antideslizantes Melocotón Move para Pilates de piso, reformer y barre en México. Nuestras calcetas son unitalla y cuentan con agarre en la planta. Compara los modelos Basic y Curly y elige tu color."
    contentSections={[
      { heading: "Agarre para clases de Pilates y reformer", body: "Las zonas antideslizantes de la planta ayudan a reducir el deslizamiento en determinadas superficies durante ejercicios de Pilates, reformer y barre. El agarre no sustituye las indicaciones de tu instructor." },
      { heading: "Modelos Basic y Curly, todos unitalla", body: "Explora los modelos Basic y Curly y sus colores disponibles. Compara fotografías, diseño y composición en las fichas de cada variante antes de elegir; el ajuste puede variar según la forma de tu pie." },
    ]}
    faqs={[
      { question: "¿Para qué sirven las calcetas antideslizantes de Pilates?", answer: "Su superficie de agarre en la planta del pie ayuda a reducir el deslizamiento durante los movimientos sobre superficies de práctica. No sustituye una técnica adecuada ni garantiza evitar caídas." },
      { question: "¿Se pueden usar para Pilates reformer y barre?", answer: "Sí. Las calcetas antideslizantes son una opción habitual para Pilates de piso, reformer y barre. Revisa los requisitos de tu estudio antes de asistir a clase." },
      { question: "¿Qué talla tienen las calcetas de Melocotón Move?", answer: "Todas nuestras calcetas antideslizantes son unitalla. Consulta las fotografías y detalles de cada modelo para conocer su diseño." },
      { question: "¿Qué modelos y colores están disponibles?", answer: "Puedes explorar los modelos Basic y Curly y sus variantes de color en esta página. Consulta cada ficha para comprobar sus detalles y disponibilidad." },
      { question: "¿Dónde comprar calcetas antideslizantes para Pilates en México?", answer: "Puedes comprar calcetas antideslizantes Melocotón Move en nuestra tienda en línea oficial. Aquí encontrarás las variantes de los modelos Basic y Curly y podrás consultar sus fichas antes de añadirlas al carrito." },
      { question: "¿Todas las calcetas tienen la misma composición?", answer: "La composición debe comprobarse en la ficha de cada producto o variante. No todos los diseños tienen necesariamente las mismas especificaciones." },
    ]}
    guide={{ href: "/guia-calcetas-antideslizantes-pilates", title: "Guía para elegir tus calcetas", description: "Conoce qué revisar sobre agarre, ajuste y modelos para Pilates, reformer y barre." }}
    canonicalPath="/calcetines-antideslizantes-pilates"
  />;
}
