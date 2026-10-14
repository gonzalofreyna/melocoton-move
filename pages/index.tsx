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

      {/* Editorial de comunidad: integrada en la Home, sin tarjeta ni sombra. */}
      {/* Visible en el HTML inicial y siempre después del Hero. */}
      <section
        aria-labelledby="home-melocoton-movimiento"
        className="w-full border-b border-brand-line/60 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <Link
            href="/melocoton-en-movimiento"
            className="group grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-5 text-left focus-visible:rounded-2xl sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-12 lg:gap-20"
            aria-label="Descubre Melocotón en movimiento: historias de nuestra comunidad"
          >
            <div className="relative min-w-0 overflow-hidden rounded-2xl bg-white">
              <img
                src="https://melocoton-move-assets.s3.us-east-1.amazonaws.com/videos/customers/portada/4125f23c3a9141589692e1587489afbe-poster.webp"
                alt="Portada de los videos de la comunidad Melocotón Move"
                width={270}
                height={480}
                loading="lazy"
                decoding="async"
                className="h-[245px] w-full object-cover object-center transition-transform duration-700 motion-reduce:transition-none group-hover:scale-[1.025] sm:h-[370px] sm:max-w-[285px]"
              />
            </div>
            <div className="min-w-0 py-1 sm:py-6">
              <span aria-hidden="true" className="mb-4 block h-px w-10 bg-brand-wine/50 sm:mb-6 sm:w-14" />
              <p className="mm-eyebrow">Nuestra comunidad</p>
              <h2
                id="home-melocoton-movimiento"
                className="mm-heading mt-3 text-[clamp(1.55rem,6vw,2.15rem)] leading-[1.08] sm:mt-5 sm:text-5xl lg:text-[3.5rem]"
              >
                Melocotón en movimiento
              </h2>
              <p className="mm-copy mt-3 text-xs leading-5 sm:mt-6 sm:max-w-md sm:text-base sm:leading-8">
                Cada práctica tiene su historia. Descubre nuestros videos y los momentos que nos inspiran.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 border-b border-brand-ink pb-1 text-[11px] font-semibold tracking-wide text-brand-ink transition-colors group-hover:border-brand-wine group-hover:text-brand-wine sm:mt-8 sm:gap-3 sm:text-sm">
                Descubre nuestras historias <span aria-hidden="true">↗</span>
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
