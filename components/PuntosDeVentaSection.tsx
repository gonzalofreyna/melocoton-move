"use client";

import { motion, Variants } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

type PuntoDeVenta = {
  estado: string;
  logo: string;
};

type Header = {
  title?: string;
  subtitle?: string;
};

type PuntosDeVentaSectionProps = {
  header?: Header;
  puntos: PuntoDeVenta[];
};

export default function PuntosDeVentaSection({
  header,
  puntos,
}: PuntosDeVentaSectionProps) {
  if (!Array.isArray(puntos) || puntos.length === 0) return null;

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 px-6 bg-gray-50 w-full relative overflow-hidden">
      {/* Encabezado */}
      <div className="relative z-10 text-center mb-12">
        {header?.title && (
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-brand-blue mb-3 tracking-tight"
          >
            {header.title}
          </motion.h2>
        )}
        {header?.subtitle && (
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-gray-600 text-lg max-w-2xl mx-auto"
          >
            {header.subtitle}
          </motion.p>
        )}
      </div>

      {/* Swiper con logos circulares */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={30}
          slidesPerView={2}
          breakpoints={{
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
          }}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          loop={true}
          className="w-full"
        >
          {puntos.map((punto, idx) => (
            <SwiperSlide
              key={`${punto.estado}-${idx}`}
              className="flex flex-col items-center"
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: idx * 0.1,
                }}
                className="flex flex-col items-center p-4"
              >
                {/* Contenedor circular */}
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-500 hover:scale-110">
                  <motion.img
                    src={punto.logo}
                    alt={punto.estado}
                    whileHover={{ scale: 1.05 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="h-12 w-12 object-contain"
                  />
                </div>

                <p className="text-brand-blue font-semibold text-sm mt-4 text-center">
                  {punto.estado}
                </p>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
