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
      <main className="bg-gray-50 px-6 py-16">
        <article className="mx-auto max-w-3xl text-gray-700">
          <nav aria-label="Ruta de navegación" className="mb-6 text-sm">
            <Link className="underline" href="/">Inicio</Link> / <Link className="underline" href="/calcetines-antideslizantes-pilates">Calcetas antideslizantes</Link> / Guía de compra
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-blue">Cómo elegir calcetas antideslizantes para Pilates</h1>
          <p className="mt-5 leading-relaxed">Las calcetas para Pilates pueden acompañar ejercicios de piso, reformer y barre. Para elegir las más adecuadas, revisa el agarre de la planta, la comodidad y las indicaciones de tu estudio.</p>
          <section className="mt-10 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">1. Comprueba el agarre de la planta</h2>
            <p>Busca una superficie antideslizante distribuida en la zona de apoyo del pie. El agarre puede ayudar a reducir el deslizamiento en determinadas superficies, pero no elimina el riesgo de resbalar.</p>
          </section>
          <section className="mt-9 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">2. Prioriza el ajuste y la comodidad</h2>
            <p>Una calceta debe ajustarse sin resultar incómoda durante los movimientos. Consulta las tallas e imágenes del modelo antes de elegirlo.</p>
          </section>
          <section className="mt-9 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">3. Compara modelos y materiales</h2>
            <p>Melocotón Move ofrece modelos como Basic y Curly en distintos colores. Revisa la composición, textura y detalles específicos en la ficha de cada variante.</p>
          </section>
          <section className="mt-9 space-y-3">
            <h2 className="text-2xl font-semibold text-brand-blue">4. Confirma los requisitos de tu clase</h2>
            <p>Algunos estudios establecen requisitos de calzado o calcetas para sus clases. Compruébalos antes de acudir y sigue las recomendaciones de tu instructor.</p>
          </section>
          <section className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-brand-blue">Encuentra tus calcetas para Pilates</h2>
            <p className="mt-2">Explora modelos y colores disponibles en nuestro catálogo.</p>
            <Link href="/calcetines-antideslizantes-pilates" className="mt-4 inline-block rounded-lg bg-brand-blue px-5 py-3 font-semibold text-white">Ver calcetas antideslizantes</Link>
          </section>
        </article>
      </main>
    </>
  );
}
