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
      {!configLoading && (
      <>
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
      </>
      )}
      {/* Contenido y enlaces en HTML inicial, sin esperar las APIs de catálogo/configuración. */}
      <section aria-labelledby="home-brand-intro" className="w-full bg-white px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <h2 id="home-brand-intro" className="text-xl font-semibold leading-snug text-brand-blue sm:text-2xl">
            Descubre Melocotón Move: yoga, Pilates y personalización en México
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 sm:text-base">
            En Melocotón Move encontrarás tapetes profesionales de yoga y Pilates,
            calcetas antideslizantes para reformer y barre y accesorios para tu práctica.
            También puedes personalizar un mat con tu logo desde una sola pieza.
          </p>
          <nav aria-label="Explora Melocotón Move" className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-brand-blue">
            <Link className="underline underline-offset-4" href="/tapetes-yoga-pilates">Ver tapetes de yoga y Pilates</Link>
            <Link className="underline underline-offset-4" href="/calcetines-antideslizantes-pilates">Ver calcetas antideslizantes</Link>
            <Link className="underline underline-offset-4" href="/crea-tu-mat">Personalizar mi mat</Link>
          </nav>
        </div>
      </section>
      </main>
    </>
  );
}
