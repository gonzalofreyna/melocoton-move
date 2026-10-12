import Head from "next/head";
import Link from "next/link";

export default function GuiaCalcetas() {
  return (
    <>
      <Head>
        <title>Cómo elegir calcetas antideslizantes para Pilates | Melocotón Move</title>
        <meta name="description" content="Aprende qué revisar al elegir calcetas antideslizantes para Pilates, reformer y barre: agarre, ajuste, modelo y cuidados." />
        <link rel="canonical" href="https://www.melocotonmove.com/guia-calcetas-antideslizantes-pilates" />
      </Head>
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl text-sm leading-7 text-gray-700 sm:text-base">
          <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-gray-600 sm:text-sm">
            <Link className="underline" href="/">Inicio</Link> / <Link className="underline" href="/calcetines-antideslizantes-pilates">Calcetas antideslizantes</Link> / Guía de compra
          </nav>
          <h1 className="text-2xl font-bold leading-tight text-brand-blue sm:text-4xl">Cómo elegir calcetas antideslizantes para Pilates</h1>
          <p className="mt-4 text-base leading-7 sm:mt-5 sm:text-lg sm:leading-8">Las calcetas para Pilates pueden acompañar ejercicios de piso, reformer y barre. Para elegir las más adecuadas, revisa el agarre de la planta, la comodidad y las indicaciones de tu estudio.</p>
          <section className="mt-9 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-10 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">1. Comprueba el agarre de la planta</h2>
            <p>Busca una superficie antideslizante distribuida en la zona de apoyo del pie. El agarre puede ayudar a reducir el deslizamiento en determinadas superficies, pero no elimina el riesgo de resbalar.</p>
          </section>
          <section className="mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-6 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">2. Prioriza el ajuste y la comodidad</h2>
            <p>Una calceta debe ajustarse sin resultar incómoda durante los movimientos. Consulta las tallas e imágenes del modelo antes de elegirlo.</p>
          </section>
          <section className="mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-6 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">3. Compara modelos y materiales</h2>
            <p>Melocotón Move ofrece modelos como Basic y Curly en distintos colores. Revisa la composición, textura y detalles específicos en la ficha de cada variante.</p>
          </section>
          <section className="mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm sm:mt-6 sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-2xl">4. Confirma los requisitos de tu clase</h2>
            <p>Algunos estudios establecen requisitos de calzado o calcetas para sus clases. Compruébalos antes de acudir y sigue las recomendaciones de tu instructor.</p>
          </section>
          <section className="mt-10 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-xl">Encuentra tus calcetas para Pilates</h2>
            <p className="mt-2">Explora modelos y colores disponibles en nuestro catálogo.</p>
            <Link href="/calcetines-antideslizantes-pilates" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-blue px-5 py-3 text-center font-semibold text-white sm:inline-flex sm:w-auto">Ver calcetas antideslizantes</Link>
          </section>
        </article>
      </main>
    </>
  );
}
