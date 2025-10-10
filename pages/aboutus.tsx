"use client";

import { motion } from "framer-motion";
import OpeningStudioSection from "../components/OpeningStudioSection";
import { useAppConfig } from "../context/ConfigContext";

export default function AboutUs() {
  const { config, loading: configLoading } = useAppConfig();

  if (configLoading) return null;

  return (
    <main className="flex flex-col items-center text-center bg-gray-50">
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
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-6 tracking-tight"
              >
                {config.openingStudio.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="max-w-2xl text-lg sm:text-xl text-white/90 mb-8"
              >
                {config.openingStudio.description}
              </motion.p>

              <motion.a
                href={
                  config.openingStudio.buttonHref ||
                  "/products?category=reformer"
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="bg-brand-beige text-brand-blue px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-brand-blue transition-colors shadow-lg"
              >
                {config.openingStudio.buttonText}
              </motion.a>
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
            className="text-4xl font-bold text-brand-blue mb-14 tracking-tight"
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
                className="flex-shrink-0 w-[80%] sm:w-auto bg-gradient-to-br from-brand-beige/20 to-white border border-brand-beige/40 rounded-3xl shadow-sm hover:shadow-lg p-8 text-left scroll-snap-align-start transition-all duration-500 ease-out"
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
    </main>
  );
}
