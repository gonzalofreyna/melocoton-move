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
    contentSections={[
      { heading: "¿Qué materiales tienen nuestros tapetes?", body: "Nuestros mats profesionales combinan caucho natural y poliuretano de alto grado. Explora cada ficha para elegir la textura, el diseño y las características que mejor se adaptan a tu práctica." },
      { heading: "Tapetes para yoga, Pilates y estudio", body: "Un buen mat acompaña tus ejercicios de piso, estiramientos y trabajo de control. Revisa las medidas, el grosor y las opciones de personalización disponibles en cada modelo antes de elegir." },
    ]}
    faqs={[
      { question: "¿De qué están hechos los tapetes profesionales de Melocotón Move?", answer: "Los mats profesionales de esta colección combinan una superficie de poliuretano de alto grado y una base de caucho natural. Consulta la ficha de cada color o modelo para confirmar sus especificaciones." },
      { question: "¿Qué grosor tienen los tapetes?", answer: "Los tapetes profesionales de esta colección tienen 5 mm de grosor. Antes de comprar, revisa las medidas y detalles de la ficha del modelo elegido." },
      { question: "¿Puedo personalizar un tapete de yoga o Pilates?", answer: "Melocotón Move ofrece opciones de personalización mediante grabado láser. Revisa las opciones del producto o la sección de personalización para elegir un diseño." },
    ]}
    canonicalPath="/tapetes-yoga-pilates"
  />;
}
