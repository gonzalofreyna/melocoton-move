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
  videoUrl?: string;
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

  // 🕒 No renderizar mientras carga config
  if (loading) return null;

  const slides: HeroSlide[] = useMemo(
    () => (Array.isArray(config?.heroSlides) ? config.heroSlides : []),
    [config?.heroSlides]
  );

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
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
                {isVideo && slide.videoUrl ? (
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src={slide.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
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
                    {slide.title && (
                      <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        {slide.title}
                      </h1>
                    )}
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
