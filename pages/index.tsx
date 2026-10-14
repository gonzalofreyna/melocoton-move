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
      <main className="flex flex-col items-center bg-brand-cream text-center">
      {/* Popup de promociones SOLO en Home */}
      {!configLoading && <PromoModal />}

      {/* HERO DINÁMICO: su H1 se prerenderiza dentro del Hero antes de cargar config. */}
      <HeroSection />

      {/* Enlace editorial en el HTML inicial, aunque la configuración aún no haya cargado. */}
      {/* Siempre queda visualmente inmediatamente después del Hero cuando éste está activo. */}
      <section aria-labelledby="home-melocoton-movimiento" className="w-full bg-gray-50 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link href="/melocoton-en-movimiento" className="mm-card group flex items-center gap-4 p-3 text-left sm:gap-9 sm:p-6">
            <img
              src="https://melocoton-move-assets.s3.us-east-1.amazonaws.com/videos/customers/portada/4125f23c3a9141589692e1587489afbe-poster.webp"
              alt="Portada de los videos de Melocotón Move"
              width={270}
              height={480}
              loading="lazy"
              decoding="async"
              className="h-36 w-[96px] shrink-0 rounded-xl object-cover sm:h-56 sm:w-[158px]"
            />
            <div className="min-w-0 flex-1">
              <p className="mm-eyebrow">
                Nuestra comunidad
              </p>
              <h2 id="home-melocoton-movimiento" className="mm-heading mt-2 text-2xl leading-tight sm:text-4xl">
                Melocotón en movimiento
              </h2>
              <p className="mm-copy mt-3 text-xs sm:text-base">
                Cada práctica tiene su historia. Descubre nuestros videos y los momentos que nos inspiran.
              </p>
              <span className="mm-text-link mt-4">
                Descubre nuestras historias <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </div>
      </section>


      {!configLoading && (
      <>
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
          className="relative w-full bg-cover bg-center py-24 text-white sm:py-32"
          style={{
            backgroundImage: `url(${config.finalCTA.backgroundImage})`,
          }}
        >
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: config.finalCTA.overlayOpacity }}
          />
          <div className="relative z-10 max-w-2xl mx-auto text-center px-6">
            <h2 className="font-display mb-4 text-4xl font-normal sm:text-5xl">
              {config.finalCTA.title}
            </h2>
            <p className="mb-8 text-lg">{config.finalCTA.description}</p>
            <Link
              href={config.finalCTA.buttonLink}
              className="mm-button border-white bg-white text-brand-blue hover:bg-brand-blush"
            >
              {config.finalCTA.buttonText}
            </Link>
          </div>
        </section>
      )}
      </>
      )}
      {/* Contenido y enlaces en HTML inicial, sin esperar las APIs de catálogo/configuración. */}
      <section aria-labelledby="home-brand-intro" className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 id="home-brand-intro" className="mm-heading text-2xl sm:text-3xl">
            Descubre Melocotón Move: yoga, Pilates y personalización en México
          </h2>
          <p className="mm-copy mt-4">
            En Melocotón Move encontrarás tapetes profesionales de yoga y Pilates,
            calcetas antideslizantes para reformer y barre y accesorios para tu práctica.
            También puedes personalizar un mat con tu logo desde una sola pieza.
          </p>
          <nav aria-label="Explora Melocotón Move" className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm font-semibold text-brand-blue">
            <Link className="underline underline-offset-4" href="/tapetes-yoga-pilates">Ver tapetes de yoga y Pilates</Link>
            <Link className="underline underline-offset-4" href="/calcetines-antideslizantes-pilates">Ver calcetas antideslizantes</Link>
            <Link className="underline underline-offset-4" href="/crea-tu-mat">Personalizar mi mat</Link>
            <Link className="underline underline-offset-4" href="/melocoton-en-movimiento">Ver Melocotón en movimiento</Link>
          </nav>
        </div>
      </section>
      </main>
    </>
  );
}
