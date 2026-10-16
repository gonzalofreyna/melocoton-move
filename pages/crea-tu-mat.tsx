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
    answer: "Sí. Personalizamos desde una sola pieza, tanto para tu práctica como para tu estudio de Pilates o yoga.",
  },
  {
    question: "¿De qué materiales son los mats profesionales?",
    answer: "Nuestros mats profesionales tienen base de caucho natural y superficie de poliuretano de alto grado.",
  },
  {
    question: "¿Necesito tener mi logo o diseño listo antes de comprar?",
    answer: "No. Puedes elegir tu mat y completar la compra sin subir un logo. Nos pondremos en contacto contigo para confirmar los detalles del diseño.",
  },
  {
    question: "¿Qué formas puedo elegir?",
    answer: "Puedes elegir cápsula (extremos redondeados), bala (un extremo redondeado y otro más recto) o clásico (rectangular con esquinas suavizadas).",
  },
  {
    question: "¿Puedo comprar mats para un estudio de Pilates?",
    answer: "Sí. Elige la cantidad de mats y la promoción disponible en el configurador. La personalización mediante grabado láser está disponible desde una pieza.",
  },
  {
    question: "¿Cuánto tarda la entrega y cómo se cobra el envío?",
    answer: "El plazo estimado es de 45 días hábiles. El envío se cotiza y paga por separado; no está incluido en el importe de los mats.",
  },
];
export default function CreaTuMatPage() {
  return (
    <>
      <Head>
        <title>Tapetes Personalizados con Logo | Melocotón Move</title>
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

      <section className="bg-white px-4 pt-5 sm:px-6 sm:pt-9" aria-label="Tapetes personalizados de Melocotón Move">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Ruta de navegación" className="mb-5 text-xs text-gray-600 sm:mb-7 sm:text-sm">
            <Link href="/" className="underline underline-offset-2">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/tapetes-yoga-pilates" className="underline underline-offset-2">Tapetes</Link>
            <span className="mx-2">/</span>
            <span>Personaliza tu mat</span>
          </nav>
          <p className="mm-eyebrow">Desde una sola pieza · Personalización láser</p>
          <h1 className="mm-heading mt-2 text-3xl leading-tight sm:mt-3 sm:text-5xl">
            Crea tu Mat
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Personaliza tu tapete profesional de yoga o pilates. Elige forma, color y diseño a tu estilo.
          </p>
        </div>
      </section>

      <MatCustomizer />

      <section aria-labelledby="detalles-mat-personalizado" className="bg-brand-sand/40 px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mm-eyebrow">Conoce tu mat</p>
          <h2 id="detalles-mat-personalizado" className="mm-heading mt-2 text-2xl sm:text-3xl">
            Diseñado para tu movimiento
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            Crea un mat profesional Melocotón Move con base de caucho natural y superficie de
            poliuretano de alto grado. Personalízalo con tu logo mediante grabado láser,
            desde una sola pieza para ti o en varias unidades para tu estudio.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Tres formas para hacerlo tuyo: <strong>Cápsula</strong>, de extremos redondeados;
            <strong> Bala</strong>, con un extremo recto; y <strong>Clásico</strong>,
            de líneas rectangulares y esquinas suaves.
          </p>
        </div>
      </section>

      <section aria-labelledby="personalizacion-preguntas" className="bg-white px-4 pb-14 pt-3 sm:px-6 sm:pb-20">
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
            {" "}<Link href="/tapetes-yoga-pilates" className="font-semibold underline underline-offset-2">Explora nuestros tapetes de yoga y pilates</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
