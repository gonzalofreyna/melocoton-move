import Head from "next/head";
import Link from "next/link";

export default function GuiaTapetes() {
  return (
    <>
      <Head>
        <title>Cómo elegir un tapete de yoga y Pilates | Melocotón Move</title>
        <meta name="description" content="Guía para elegir un tapete de yoga y Pilates: materiales, grosor, dimensiones, uso y personalización. Consejos de Melocotón Move." />
        <link rel="canonical" href="https://www.melocotonmove.com/guia-elegir-tapete-yoga-pilates" />
      </Head>
      <main className="bg-gray-50 px-6 py-16">
        <article className="mx-auto max-w-3xl text-gray-700">
          <nav aria-label="Ruta de navegación" className="mb-6 text-sm">
            <Link className="underline" href="/">Inicio</Link> / <Link className="underline" href="/tapetes-yoga-pilates">Tapetes de yoga y Pilates</Link> / Guía de compra
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-blue">Cómo elegir un tapete de yoga y Pilates</h1>
          <p className="mt-5 leading-relaxed">Para elegir un mat, piensa primero en el tipo de ejercicios que realizas, el espacio disponible y la sensación que buscas al apoyar manos, pies y rodillas. Compara las especificaciones de cada producto antes de decidir.</p>
          <section className="mt-10 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">1. Revisa los materiales</h2>
            <p>Los tapetes profesionales de Melocotón Move combinan una superficie de poliuretano de alto grado con una base de caucho natural. La sensación de contacto y el mantenimiento pueden variar entre materiales; consulta los detalles de cada modelo y sigue sus indicaciones de cuidado.</p>
          </section>
          <section className="mt-9 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">2. Elige el grosor y las dimensiones</h2>
            <p>En la colección de mats profesionales encontrarás opciones de 5 mm. Además del grosor, comprueba el largo y ancho indicados en la ficha: necesitas espacio suficiente para estirarte y hacer los movimientos de tu rutina.</p>
          </section>
          <section className="mt-9 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">3. Considera dónde vas a practicar</h2>
            <p>Para practicar en casa, revisa las dimensiones de tu espacio. Para llevar un mat al estudio, considera también su peso, el modo de transporte y las recomendaciones de tu instructor.</p>
          </section>
          <section className="mt-9 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">4. ¿Buscas un tapete personalizado?</h2>
            <p>Melocotón Move ofrece opciones de personalización mediante grabado láser. Revisa qué modelos admiten personalización y las opciones disponibles antes de realizar tu pedido.</p>
          </section>
          <section className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-brand-blue">Explora los tapetes disponibles</h2>
            <p className="mt-2">Compara colores, formas y especificaciones directamente en nuestro catálogo.</p>
            <Link href="/tapetes-yoga-pilates" className="mt-4 inline-block rounded-lg bg-brand-blue px-5 py-3 font-semibold text-white">Ver tapetes de yoga y Pilates</Link>
          </section>
        </article>
      </main>
    </>
  );
}
