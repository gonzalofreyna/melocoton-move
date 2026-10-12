import Head from "next/head";
import Link from "next/link";

export default function GuiaTapetes() {
  return (
    <>
      <Head>
        <title>Cómo elegir un tapete de yoga y Pilates | Melocotón Move</title>
        <meta name="description" content="Guía para elegir un tapete de yoga y Pilates: materiales, grosor, dimensiones, uso y personalización. Consejos de Melocotón Move." />
        <link rel="canonical" href="https://www.melocotonmove.com/guia-elegir-tapete-yoga-pilates" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://www.melocotonmove.com/"},{"@type":"ListItem","position":2,"name":"Tapetes de yoga y Pilates","item":"https://www.melocotonmove.com/tapetes-yoga-pilates"},{"@type":"ListItem","position":3,"name":"Guía para elegir tapetes","item":"https://www.melocotonmove.com/guia-elegir-tapete-yoga-pilates"}]}) }} />
      </Head>
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl text-sm leading-7 text-gray-700 sm:text-base">
          <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-gray-600 sm:text-sm">
            <Link className="underline" href="/">Inicio</Link> / <Link className="underline" href="/tapetes-yoga-pilates">Tapetes de yoga y Pilates</Link> / Guía de compra
          </nav>
          <h1 className="text-2xl font-bold leading-tight text-brand-blue sm:text-4xl">Cómo elegir un tapete de yoga y Pilates</h1>
          <p className="mt-4 text-base leading-7 sm:mt-5 sm:text-lg sm:leading-8">Para elegir un mat, piensa primero en el tipo de ejercicios que realizas, el espacio disponible y la sensación que buscas al apoyar manos, pies y rodillas. Compara las especificaciones de cada producto antes de decidir.</p>
          <section className="mt-9 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-10 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">1. Revisa los materiales</h2>
            <p>Los tapetes profesionales de Melocotón Move combinan una superficie de poliuretano de alto grado con una base de caucho natural. La sensación de contacto y el mantenimiento pueden variar entre materiales; consulta los detalles de cada modelo y sigue sus indicaciones de cuidado.</p>
          </section>
          <section className="mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-6 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">2. Elige el grosor y las dimensiones</h2>
            <p>En la colección de mats profesionales encontrarás opciones de 5 mm. Además del grosor, comprueba el largo y ancho indicados en la ficha: necesitas espacio suficiente para estirarte y hacer los movimientos de tu rutina.</p>
          </section>
          <section className="mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-6 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">3. Considera dónde vas a practicar</h2>
            <p>Para practicar en casa, revisa las dimensiones de tu espacio. Para llevar un mat al estudio, considera también su peso, el modo de transporte y las recomendaciones de tu instructor.</p>
          </section>
          <section className="mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-6 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">4. ¿Buscas un tapete personalizado?</h2>
            <p>Melocotón Move permite personalizar un mat profesional desde una sola pieza con grabado láser. Puedes elegir la forma, el color o textura y colocar tu logo en una vista previa antes de enviar la solicitud de compra.</p>
            <Link href="/crea-tu-mat" className="inline-flex min-h-11 items-center font-semibold text-brand-blue underline underline-offset-4">Diseñar mi tapete personalizado</Link>
          </section>
          <section className="mt-10 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-xl">Explora los tapetes disponibles</h2>
            <p className="mt-2">Compara colores, formas y especificaciones directamente en nuestro catálogo.</p>
            <Link href="/tapetes-yoga-pilates" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-blue px-5 py-3 text-center font-semibold text-white sm:inline-flex sm:w-auto">Ver tapetes de yoga y Pilates</Link>
          </section>
        </article>
      </main>
    </>
  );
}
