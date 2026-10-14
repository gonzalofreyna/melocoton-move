"use client";

import Head from "next/head";

import { motion } from "framer-motion";
import OpeningStudioSection from "../components/OpeningStudioSection";
import { useAppConfig } from "../context/ConfigContext";
import Link from "next/link";

export default function AboutUs() {
  const { config, loading: configLoading } = useAppConfig();



  return (
    <>
      <Head>
        <title>Sobre Nosotros | Melocotón Move</title>
        <meta name="description" content="Conoce Melocotón Move, una marca de tapetes, calcetas y accesorios para Pilates y yoga." />
        <link rel="canonical" href="https://www.melocotonmove.com/aboutus" />
      </Head>
      <main className="bg-brand-cream">
      <section aria-labelledby="quienes-somos-melocoton" className="bg-brand-cream px-6 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 id="quienes-somos-melocoton" className="mm-heading text-4xl sm:text-5xl">
            ¿Qué es Melocotón Move?
          </h1>
          <p className="mt-4 leading-relaxed text-gray-700">
            Melocotón Move es una marca de México enfocada en productos para yoga y Pilates:
            tapetes, calcetas antideslizantes y accesorios para practicar en casa o en estudio.
            Nuestro catálogo incluye tapetes personalizables y complementos para ejercicios
            de fuerza, control y movilidad.
          </p>
          <p className="mt-4 text-gray-700">
            Explora nuestros <Link href="/tapetes-yoga-pilates" className="underline">tapetes de yoga y Pilates</Link>
            {" "}y nuestras <Link href="/calcetines-antideslizantes-pilates" className="underline">calcetas antideslizantes</Link>
            {" "}para conocer los diseños y especificaciones disponibles.
          </p>
          <section aria-labelledby="diferencias-melocoton" className="mm-card mt-8 p-5 text-left sm:p-7">
            <h2 id="diferencias-melocoton" className="text-xl font-semibold text-brand-blue">
              ¿Qué ofrece Melocotón Move para tu práctica?
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-700 sm:text-base">
              <li>Una colección de mats profesionales de caucho natural y poliuretano de alto grado, con opciones de 5 mm.</li>
              <li>Personalización láser desde una sola unidad y elección entre formas cápsula, bala y clásico.</li>
              <li>Calcetas antideslizantes y accesorios para complementar tus clases de yoga, Pilates y barre.</li>
              <li>Opciones para quienes practican en casa y para estudios que buscan productos con su identidad.</li>
            </ul>
            <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
              <Link href="/guia-elegir-tapete-yoga-pilates" className="font-semibold underline underline-offset-4">
                Compara qué mat se adapta a tu práctica
              </Link>{" "}
              o <Link href="/crea-tu-mat" className="font-semibold underline underline-offset-4">conoce cómo personalizarlo</Link>.
            </p>
          </section>
        </div>
      </section>
      {!configLoading && <div className="flex flex-col items-center text-center bg-gray-50">
      {/* 🌸 HERO SECTION */}
      {config?.featureFlags?.showOpeningStudio &&
        config?.openingStudio?.enabled && (
          <section className="relative w-full overflow-hidden">
            {/* 🖼 Imagen de fondo con overlay */}
            <div className="absolute inset-0">
              <img
                src={config.openingStudio.image}
                alt={config.openingStudio.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white/90" />
            </div>

            {/* ✨ Contenido hero */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center py-32 px-6 sm:py-44">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-display mb-6 text-4xl font-normal tracking-tight text-white drop-shadow-lg sm:text-6xl"
              >
                {config.openingStudio.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="max-w-2xl text-lg sm:text-xl text-white/90 mb-8"
              >
                {config.openingStudio.description}
              </motion.p>

              <Link
                href={
                  config.openingStudio.buttonHref ||
                  "/products?category=reformer"
                }
                className="mm-button border-white bg-white text-brand-blue hover:bg-brand-blush"
              >
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.4 }}
                >
                  {config.openingStudio.buttonText}
                </motion.span>
              </Link>
            </div>
          </section>
        )}

      {/* 🩵 BENEFICIOS SECTION (mejorada para móvil) */}
      {config?.featureFlags?.showBenefits && config?.benefits?.enabled && (
        <section className="py-20 px-6 bg-white w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mm-heading mb-14 text-4xl sm:text-5xl"
          >
            {config.benefits.header}
          </motion.h2>

          {/* 🧩 En móvil → carrusel horizontal */}
          <div
            className="flex sm:grid gap-6 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3 overflow-x-auto sm:overflow-visible pb-4 scrollbar-hide"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x",
              scrollSnapType: "x mandatory",
            }}
          >
            {config.benefits.items.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
                className="mm-card w-[80%] flex-shrink-0 snap-start bg-white p-8 text-left sm:w-auto"
              >
                <h3 className="text-xl font-semibold text-brand-blue mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{benefit.text}</p>
              </motion.div>
            ))}
          </div>

          {/* ✨ Efecto visual de carrusel móvil */}
          <style jsx>{`
            @media (max-width: 640px) {
              div::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                scrollbar-width: none;
              }
            }
          `}</style>
        </section>
      )}
    </div>}
      </main>
    </>
  );
}
