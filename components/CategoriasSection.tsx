"use client";

import { motion } from "framer-motion";

type Categoria = {
  name: string;
  image: string;
  href: string;
  overlay?: string;
};

type CategoriasSectionProps = {
  title?: string;
  categories?: Categoria[];
};

export default function CategoriasSection({
  title = "Melocotón Shop",
  categories = [],
}: CategoriasSectionProps) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-white w-full">
      {/* 🩷 Título principal */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-brand-blue mb-16 text-center tracking-tight"
      >
        {title}
      </motion.h2>

      {/* 🧩 Scroll horizontal en móvil / grid en desktop */}
      <div
        className="
          flex
          sm:grid
          gap-6
          sm:gap-10
          lg:gap-20
          sm:grid-cols-2
          lg:grid-cols-3
          overflow-x-auto
          sm:overflow-visible
          pb-4
          scrollbar-hide
        "
      >
        {categories.map((cat, idx) => {
          const overlaySrc = cat.overlay || "/images/hover-overlay.svg";
          return (
            <motion.a
              key={idx}
              href={cat.href}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="
                flex-shrink-0
                w-[70%]
                sm:w-auto
                flex
                flex-col
                items-center
                cursor-pointer
                mx-auto
                transition-transform
                duration-700
                ease-out
              "
            >
              {/* 📸 Imagen cuadrada con overlay */}
              <div
                className="
                  relative
                  w-full
                  aspect-square
                  rounded-3xl
                  overflow-hidden
                  shadow-lg
                  hover:shadow-xl
                  transition-all
                  duration-700
                  ease-out
                "
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="
                    w-full
                    h-full
                    object-cover
                    rounded-3xl
                    transition-transform
                    duration-700
                    group-hover:scale-105
                  "
                />

                {/* Overlay blanco brillante */}
                <div
                  className="
                    absolute inset-0 flex items-center justify-center
                    bg-black/0
                    hover:bg-black/20
                    transition-all duration-700
                  "
                >
                  <img
                    src={overlaySrc}
                    alt={`${cat.name} overlay`}
                    className="
                      opacity-0 hover:opacity-90
                      w-[70%] h-[70%] lg:w-[85%] lg:h-[85%]
                      transition-all duration-700 ease-out
                      filter brightness-[300%] saturate-150
                    "
                  />
                </div>
              </div>

              {/* 🏷️ Nombre debajo */}
              <p className="mt-5 text-base sm:text-lg font-semibold text-brand-blue text-center">
                {cat.name}
              </p>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
