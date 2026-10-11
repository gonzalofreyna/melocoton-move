// pages/index.tsx
import "swiper/css";
import "swiper/css/pagination";

import { useAppConfig } from "../context/ConfigContext";
import { useProducts } from "../context/ProductsContext";

import PromoModal from "../components/PromoModal";
import PuntosDeVentaSection from "../components/PuntosDeVentaSection";
import CategoriasSection from "../components/CategoriasSection";
import AboutUsHero from "../components/AboutUsHero";
import FeaturedProductsSection from "../components/FeaturedProductsSection";
import HeroSection from "../components/HeroSection";
import Link from "next/link";
import Head from "next/head";

export default function Home() {
  const { config, loading: configLoading } = useAppConfig();
  const { products, loading: productsLoading, error } = useProducts();

  if (configLoading) return null;

  const showHero =
    !!config?.featureFlags?.showHero &&
    Array.isArray(config?.heroSlides) &&
    config.heroSlides.length > 0;

  return (
    <>
      <Head>
        <title>Melocotón Move | Tapetes de Yoga y Accesorios de Pilates</title>
        <meta
          name="description"
          content="Descubre tapetes de yoga y Pilates, calcetines antideslizantes y accesorios para tu práctica. Diseños exclusivos en Melocotón Move México."
        />
        <link rel="canonical" href="https://www.melocotonmove.com/" />
      </Head>
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
      <FeaturedProductsSection />

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
            <Link
              href={config.finalCTA.buttonLink}
              className="inline-block bg-brand-beige text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-white transition-transform transform hover:scale-105 shadow-md"
            >
              {config.finalCTA.buttonText}
            </Link>
          </div>
        </section>
      )}
      </main>
    </>
  );
}
