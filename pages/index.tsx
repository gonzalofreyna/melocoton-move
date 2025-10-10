// pages/index.tsx
import { useEffect, useState } from "react";
import { fetchProducts } from "../lib/fetchProducts";
import type { Product } from "../lib/fetchProducts";
import "swiper/css";
import "swiper/css/pagination";

import { useAppConfig } from "../context/ConfigContext";
import PromoModal from "../components/PromoModal";
import OpeningStudioSection from "../components/OpeningStudioSection";
import { EventosFromConfig } from "../components/EventosCarousel";
import PuntosDeVentaSection from "../components/PuntosDeVentaSection";
import CategoriasSection from "../components/CategoriasSection";
import AboutUsHero from "../components/AboutUsHero";
import FeaturedProductsSection from "../components/FeaturedProductsSection";

// 👇 NUEVO Hero dinámico
import HeroSection from "../components/HeroSection";

export default function Home() {
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

  if (configLoading) return null;

  const showHero =
    !!config?.featureFlags?.showHero &&
    Array.isArray(config?.heroSlides) &&
    config.heroSlides.length > 0;

  const featuredProducts = products.filter((p) => p.featured);

  return (
    <main className="flex flex-col items-center text-center bg-gray-50">
      {/* Popup de promociones SOLO en Home */}
      <PromoModal />

      {/* HERO DINÁMICO */}
      {showHero && <HeroSection />}

      {/* Categorías */}
      {config?.categories && (
        <CategoriasSection title="Categorías" categories={config.categories} />
      )}

      {/* About us */}
      <AboutUsHero />

      {/* Productos destacados */}
      <FeaturedProductsSection
        featuredProducts={featuredProducts}
        loading={loading}
        config={config}
      />

      {/* Puntos de venta */}
      {config?.featureFlags?.showPuntosDeVenta &&
        Array.isArray(config?.puntosDeVenta) &&
        config.puntosDeVenta.length > 0 && (
          <PuntosDeVentaSection
            header={config?.puntosDeVentaHeader}
            puntos={config.puntosDeVenta}
          />
        )}

      {/* Eventos */}
      <EventosFromConfig className="w-full py-20 px-6 bg-white" />

      {/* CTA final */}
      {config?.featureFlags?.showFinalCTA && config?.finalCTA?.enabled && (
        <section
          className="relative w-full py-24 bg-fixed bg-center bg-cover text-white"
          style={{
            backgroundImage: `url(${config.finalCTA.backgroundImage})`,
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
