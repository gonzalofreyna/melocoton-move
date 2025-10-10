import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { fetchProducts } from "../lib/fetchProducts";
import type { Product } from "../lib/fetchProducts";
import "swiper/css";
import "swiper/css/pagination";

import { useAppConfig } from "../context/ConfigContext";
import { resolveImage } from "../lib/resolveImage";
import PromoModal from "../components/PromoModal";

// 👇 NUEVO
import OpeningStudioSection from "../components/OpeningStudioSection";
import { EventosFromConfig } from "../components/EventosCarousel";
import PuntosDeVentaSection from "../components/PuntosDeVentaSection";
import CategoriasSection from "../components/CategoriasSection";
import AboutUsHero from "../components/AboutUsHero";
import FeaturedProductsSection from "../components/FeaturedProductsSection";

export default function Home() {
  // 1) Hooks SIEMPRE primero y en el mismo orden
  const { config, loading: configLoading } = useAppConfig();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchProducts();
        if (mounted) setProducts(data);
      } catch (e) {
        console.error("Error cargando productos", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 2) Corta el render DESPUÉS de declarar hooks
  if (configLoading) return null;

  // 3) Lee y deriva valores del AC con optional chaining
  const showHero =
    !!config?.featureFlags?.showHero && !!config?.hero?.desktopImage;

  const heroBgUrl =
    showHero && config?.hero?.desktopImage
      ? resolveImage(config.hero.desktopImage)
      : null;

  const heroOverlayEnabled = !!config?.hero?.overlay?.enabled;
  const heroOverlayOpacity = config?.hero?.overlay?.opacity ?? 0;

  const heroTitle = config?.hero?.title || null;
  const heroParagraph = config?.hero?.alt || null;

  const featuredProducts = products.filter((p) => p.featured);

  return (
    <main className="flex flex-col items-center text-center bg-gray-50">
      {/* Popup de promociones SOLO en Home */}
      <PromoModal />

      {/* HERO PRINCIPAL */}
      {showHero && heroBgUrl && (
        <section
          className="relative w-full h-screen bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `url('${heroBgUrl}')` }}
          aria-label={config?.hero?.alt || "Hero"}
        >
          {heroOverlayEnabled && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: heroOverlayOpacity }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative z-10 text-white max-w-2xl px-6"
          >
            {heroTitle && (
              <h1 className="text-5xl font-extrabold mb-6 tracking-wide">
                {heroTitle}
              </h1>
            )}
            {heroParagraph && (
              <p className="text-lg mb-8 leading-relaxed">{heroParagraph}</p>
            )}

            <a
              href="/products"
              className="bg-brand-beige text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-white transition-transform transform hover:scale-105 shadow-md"
            >
              Ver Productos
            </a>
          </motion.div>
        </section>
      )}

      {config?.categories && (
        <CategoriasSection title="Categorías" categories={config.categories} />
      )}

      <AboutUsHero />

      <FeaturedProductsSection
        featuredProducts={featuredProducts}
        loading={loading}
        config={config}
      />

      {config?.featureFlags?.showPuntosDeVenta &&
        Array.isArray(config?.puntosDeVenta) &&
        config.puntosDeVenta.length > 0 && (
          <PuntosDeVentaSection
            header={config?.puntosDeVentaHeader}
            puntos={config.puntosDeVenta}
          />
        )}

      {/* 👉 Eventos (desde AC) — ABAJO DEL CTA */}
      <EventosFromConfig className="w-full py-20 px-6 bg-white" />

      {config?.featureFlags?.showFinalCTA && config?.finalCTA?.enabled && (
        <section
          className="relative w-full py-24 bg-fixed bg-center bg-cover text-white"
          style={{
            backgroundImage: `url(${resolveImage(
              config.finalCTA.backgroundImage
            )})`,
          }}
        >
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: config.finalCTA.overlayOpacity }}
          />
          <div className="relative z-10 max-w-2xl mx-auto text-center px-6">
            <h2 className="text-4xl font-extrabold mb-4">
              {config.finalCTA.title}
            </h2>
            <p className="mb-8 text-lg">{config.finalCTA.description}</p>
            <a
              href={config.finalCTA.buttonLink}
              className="bg-brand-beige text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-white transition-transform transform hover:scale-105 shadow-md"
            >
              {config.finalCTA.buttonText}
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
