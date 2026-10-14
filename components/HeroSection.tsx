// components/HeroSection.tsx
"use client";

import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useState, useEffect, useMemo } from "react";
import { resolveImage } from "../lib/resolveImage";
import { useAppConfig } from "../context/ConfigContext";
import Link from "next/link";

type HeroSlide = {
  type: "image" | "video";
  desktopImage?: string;
  mobileImage?: string;
  desktopVideo?: string; // opcional
  mobileVideo?: string; // 👈 nuevo campo
  videoUrl?: string; // se mantiene como fallback general
  title?: string;
  paragraph?: string;
  alt?: string;
  cta?: { text?: string; href?: string; enabled?: boolean };
  overlay?: { enabled?: boolean; opacity?: number };
};

export default function HeroSection() {
  const { config, loading } = useAppConfig();
  const [isMobile, setIsMobile] = useState(false);

  // 🔍 Detecta dispositivo una sola vez + listener de resize
  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Mantener las mismas llamadas de hooks en todos los renders.
  const slides: HeroSlide[] = useMemo(
    () => (Array.isArray(config?.heroSlides) ? config.heroSlides : []),
    [config?.heroSlides]
  );

  // En la configuración del carrusel sólo uno de sus títulos será el H1.
  // Los demás mantienen exactamente las mismas clases visuales como H2.
  const mainTitleIndex = slides.findIndex((slide) => !!slide.title?.trim());
  const heroEnabled = !loading && !!config?.featureFlags?.showHero && slides.length > 0;

  // El config se carga en el navegador. El H1 debe existir también en el HTML
  // inicial (SSR/SSG) DENTRO del Hero, no en otra sección del Home.
  // No mostrar un placeholder visual que modifique la experiencia del carrusel.
  if (!heroEnabled) {
    return (
      <section aria-label="Hero de Melocotón Move" className="sr-only">
        <h1>Melocotón Move: tapetes de yoga y Pilates en México</h1>
      </section>
    );
  }

  return (
    <section aria-label="Hero de Melocotón Move" className="relative w-full h-screen overflow-hidden">
      {mainTitleIndex === -1 && (
        <h1 className="sr-only">Melocotón Move: tapetes de yoga y Pilates en México</h1>
      )}
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 12000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          bulletClass:
            "swiper-pagination-bullet !bg-white !opacity-50 hover:!opacity-100",
          bulletActiveClass: "!opacity-100 !bg-brand-beige",
        }}
        loop
        className="h-full"
      >
        {slides.map((slide, idx) => {
          const isVideo = slide.type === "video";
          const overlayEnabled = !!slide?.overlay?.enabled;
          const overlayOpacity = slide?.overlay?.opacity ?? 0.3;

          // 📱 Imagen correcta según dispositivo
          const imgSrc = isMobile
            ? resolveImage(slide.mobileImage || slide.desktopImage)
            : resolveImage(slide.desktopImage);

          return (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-screen flex items-center justify-center text-center">
                {/* 🎥 Fondo dinámico */}

                {/* 🎥 Fondo dinámico con soporte para mobileVideo */}
                {isVideo ? (
                  isMobile && slide.mobileVideo ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={slide.mobileVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : slide.desktopVideo ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={slide.desktopVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : slide.videoUrl ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={slide.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={slide.alt || slide.title || `Hero ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                  ) : null
                ) : (
                  imgSrc && (
                    <img
                      src={imgSrc}
                      alt={slide.alt || slide.title || `Hero ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                  )
                )}

                {/* 🌫 Overlay */}
                {overlayEnabled && (
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                  />
                )}

                {/* ✨ Contenido */}
                {(slide.title || slide.paragraph || slide.cta?.enabled) && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                    className="relative z-10 text-white max-w-2xl px-6"
                  >
                    {slide.title && (idx === mainTitleIndex ? (
                      <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        {slide.title}
                      </h1>
                    ) : (
                      <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        {slide.title}
                      </h2>
                    ))}
                    {slide.paragraph && (
                      <p className="text-base md:text-lg mb-8 leading-relaxed">
                        {slide.paragraph}
                      </p>
                    )}
                    {slide.cta?.enabled && slide.cta?.text && (
                      <Link
                        href={slide.cta.href || "/products"}
                        className="inline-block bg-brand-beige text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-white transition-transform transform hover:scale-105 shadow-md"
                      >
                        {slide.cta.text}
                      </Link>
                    )}
                  </motion.div>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
