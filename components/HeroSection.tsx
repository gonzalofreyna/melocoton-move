// components/HeroSection.tsx
"use client";

import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useState, useEffect, useMemo, useRef } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  // 🔍 Detecta dispositivo una sola vez + listener de resize
  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(motionPreference.matches);
    updateSize();
    updateMotion();
    motionPreference.addEventListener?.("change", updateMotion);
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      motionPreference.removeEventListener?.("change", updateMotion);
    };
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

  // Solo reproduce el video del slide activo. Al cambiar de slide, pausa
  // los otros videos y respeta la preferencia del sistema por menos movimiento.
  useEffect(() => {
    if (!heroEnabled) return;
    const videos = heroRef.current?.querySelectorAll<HTMLVideoElement>("video");
    videos?.forEach((video) => {
      const slideActive = video.closest(".swiper-slide")?.classList.contains("swiper-slide-active");
      if (slideActive && !reduceMotion) {
        video.muted = true;
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex, heroEnabled, reduceMotion]);

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
    <section ref={heroRef} aria-label="Hero de Melocotón Move" className="melocoton-hero relative isolate w-full h-[76svh] min-h-[500px] max-h-[840px] overflow-hidden bg-brand-ink sm:h-[80vh] sm:min-h-[600px]">
      {mainTitleIndex === -1 && (
        <h1 className="sr-only">Melocotón Move: tapetes de yoga y Pilates en México</h1>
      )}
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={reduceMotion ? false : { delay: 8000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        speed={reduceMotion ? 0 : 850}
        pagination={{
          clickable: true,
          bulletClass: "swiper-pagination-bullet",
          bulletActiveClass: "swiper-pagination-bullet-active",
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
              <div className="relative flex h-full w-full items-end justify-center text-center sm:items-center sm:justify-start sm:text-left">
                {/* 🎥 Fondo dinámico */}

                {/* 🎥 Fondo dinámico con soporte para mobileVideo */}
                {isVideo ? (
                  isMobile && slide.mobileVideo ? (
                    <video
                      data-slide-index={idx}
                      className="absolute inset-0 w-full h-full object-cover"
                      src={slide.mobileVideo}
                      autoPlay={idx === activeIndex && !reduceMotion}
                      preload={idx === 0 ? "metadata" : "none"}
                      loop
                      muted
                      playsInline
                    />
                  ) : slide.desktopVideo ? (
                    <video
                      data-slide-index={idx}
                      className="absolute inset-0 w-full h-full object-cover"
                      src={slide.desktopVideo}
                      autoPlay={idx === activeIndex && !reduceMotion}
                      preload={idx === 0 ? "metadata" : "none"}
                      loop
                      muted
                      playsInline
                    />
                  ) : slide.videoUrl ? (
                    <video
                      data-slide-index={idx}
                      className="absolute inset-0 w-full h-full object-cover"
                      src={slide.videoUrl}
                      autoPlay={idx === activeIndex && !reduceMotion}
                      preload={idx === 0 ? "metadata" : "none"}
                      loop
                      muted
                      playsInline
                    />
                  ) : imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={slide.alt || slide.title || `Hero ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  ) : null
                ) : (
                  imgSrc && (
                    <img
                      src={imgSrc}
                      alt={slide.alt || slide.title || `Hero ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  )
                )}

                {/* Overlay editorial adaptado al móvil y escritorio; no altera la foto original. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#21191C]/75 via-[#21191C]/15 to-[#21191C]/10 sm:bg-gradient-to-r sm:from-[#21191C]/65 sm:via-[#21191C]/20 sm:to-transparent" />

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
                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.75 }}
                    className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 text-white sm:mx-0 sm:px-12 sm:pb-8 lg:px-20"
                  >
                    <div className="max-w-[610px]">
                    <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/85 sm:text-xs">MELOCOTÓN MOVE · EN MOVIMIENTO</p>
                    {slide.title && (idx === mainTitleIndex ? (
                      <h1 className="font-display text-[clamp(2.8rem,10vw,4.6rem)] leading-[0.98] font-normal tracking-[-0.035em] drop-shadow-sm sm:text-[clamp(4rem,5.8vw,6.5rem)] mb-5">
                        {slide.title}
                      </h1>
                    ) : (
                      <h2 className="font-display text-[clamp(2.8rem,10vw,4.6rem)] leading-[0.98] font-normal tracking-[-0.035em] drop-shadow-sm sm:text-[clamp(4rem,5.8vw,6.5rem)] mb-5">
                        {slide.title}
                      </h2>
                    ))}
                    {slide.paragraph && (
                      <p className="mx-auto mb-8 max-w-lg text-sm leading-7 text-white/90 sm:mx-0 sm:text-lg sm:leading-8">
                        {slide.paragraph}
                      </p>
                    )}
                    {slide.cta?.enabled && slide.cta?.text && (
                      <Link
                        href={slide.cta.href || "/products"}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-white bg-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.11em] text-brand-ink transition-colors hover:border-brand-blush hover:bg-brand-blush sm:text-sm"
                      >
                        {slide.cta.text}
                      </Link>
                    )}
                    </div>
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
