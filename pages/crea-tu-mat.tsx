import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

// El personalizador necesita canvas/browser y permanece sin SSR.
const MatCustomizer = dynamic(() => import("../components/MatCustomizer"), {
  ssr: false,
});

const faqs = [
  {
    question: "¿Puedo personalizar un solo tapete?",
    answer: "Sí. Puedes crear un diseño desde una sola pieza. Selecciona la cantidad en el personalizador y envía tu solicitud por WhatsApp.",
  },
  {
    question: "¿De qué materiales son los tapetes profesionales?",
    answer: "Los mats profesionales de Melocotón Move combinan una base de caucho natural y una superficie de poliuretano de alto grado. Confirma los detalles del modelo al realizar tu pedido.",
  },
  {
    question: "¿Cómo personalizo mi tapete con un logo?",
    answer: "Elige la forma y el color o textura, sube tu logo y ajusta su posición en la vista previa. Puedes descargar tu diseño y enviarlo por WhatsApp para continuar con el pedido. Ofrecemos personalización mediante grabado láser.",
  },
  {
    question: "¿Puedo pedir varios tapetes para un estudio de Pilates?",
    answer: "Sí. El personalizador permite elegir varias unidades. Indica la cantidad y los detalles de tu proyecto al enviar la solicitud por WhatsApp.",
  },
];

export default function CreaTuMatPage() {
  return (
    <>
      <Head>
        <title>Tapete de Yoga y Pilates Personalizado con Logo | Melocotón Move</title>
        <meta
          name="description"
          content="Personaliza un tapete profesional de yoga y Pilates con tu logo desde una pieza en México. Caucho natural y poliuretano, grabado láser y diseño a tu gusto."
        />
        <link rel="canonical" href="https://www.melocotonmove.com/crea-tu-mat" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.melocotonmove.com/" },
                { "@type": "ListItem", position: 2, name: "Tapetes de yoga y Pilates", item: "https://www.melocotonmove.com/tapetes-yoga-pilates" },
                { "@type": "ListItem", position: 3, name: "Personaliza tu mat", item: "https://www.melocotonmove.com/crea-tu-mat" },
              ],
            }),
          }}
        />
      </Head>

      <section className="bg-brand-cream px-4 pt-10 sm:px-6 sm:pt-16" aria-label="Tapetes personalizados de Melocotón Move">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Ruta de navegación" className="mb-5 text-xs text-gray-600 sm:text-sm">
            <Link href="/" className="underline underline-offset-2">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/tapetes-yoga-pilates" className="underline underline-offset-2">Tapetes</Link>
            <span className="mx-2">/</span>
            <span>Personaliza tu mat</span>
          </nav>
          <p className="mm-eyebrow">
            Desde una sola pieza · Personalización láser
          </p>
          <h1 className="mm-heading mt-4 text-3xl sm:text-5xl">
            Tapetes de yoga y Pilates personalizados con tu logo en México
          </h1>
          <p className="mm-copy mt-5">
            Crea un tapete profesional con base de caucho natural y superficie de poliuretano
            de alto grado. Elige forma, color o textura y añade tu logo desde una sola unidad,
            tanto para tu práctica como para tu estudio.
          </p>
          <section aria-labelledby="formas-mat-disponibles" className="mm-card mt-8 p-5 sm:p-7">
            <h2 id="formas-mat-disponibles" className="font-display text-xl font-normal text-brand-ink sm:text-2xl">
              Tres formas para personalizar tu mat
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-700">
              <strong>Cápsula:</strong> extremos redondeados.{" "}
              <strong>Bala:</strong> un extremo redondeado y otro más recto.{" "}
              <strong>Clásico:</strong> contorno rectangular de esquinas suavizadas.
              Elige cualquiera de estas formas, selecciona color o textura y agrega tu logo con grabado láser desde una sola pieza.
            </p>
          </section>
          <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
            Diseña tu mat en el personalizador de abajo. Al finalizar, descarga la vista previa
            y envía tu solicitud de compra por WhatsApp.
          </p>
        </div>
      </section>

      <MatCustomizer />

      <section aria-labelledby="personalizacion-preguntas" className="bg-brand-cream px-4 pb-14 pt-3 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 id="personalizacion-preguntas" className="mm-heading text-2xl sm:text-3xl">
            Preguntas frecuentes sobre tapetes personalizados
          </h2>
          <div className="mt-5 space-y-3">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group rounded-2xl border border-brand-line bg-white px-4 py-1 sm:px-5">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold leading-6 text-gray-900 sm:text-base [&::-webkit-details-marker]:hidden">
                  {question}
                  <span aria-hidden="true" className="shrink-0 text-xl font-normal group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 text-sm leading-7 text-gray-600 sm:text-base">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-gray-600">
            ¿Quieres comparar diseños antes de personalizar?
            {" "}<Link href="/tapetes-yoga-pilates" className="font-semibold underline underline-offset-2">Explora nuestros tapetes de yoga y Pilates</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
