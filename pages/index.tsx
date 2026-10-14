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
        </>
      )}

      {/* Enlace editorial en el HTML inicial, aunque la configuración aún no haya cargado. */}
      {/* Siempre queda visualmente inmediatamente después del Hero cuando éste está activo. */}
      <section aria-labelledby="home-melocoton-movimiento" className="w-full bg-gray-50 px-4 py-9 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <Link href="/melocoton-en-movimiento" className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[#e8ddd5] bg-white p-3 text-left shadow-sm transition hover:shadow-md sm:gap-8 sm:p-5">
            <img
              src="https://melocoton-move-assets.s3.us-east-1.amazonaws.com/videos/customers/portada/4125f23c3a9141589692e1587489afbe-poster.webp"
              alt="Portada de los videos de Melocotón Move"
              width={270}
              height={480}
              loading="lazy"
              decoding="async"
              className="h-36 w-[94px] shrink-0 rounded-xl object-cover sm:h-52 sm:w-[146px]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#81645f] sm:text-xs">
                Nuestra comunidad
              </p>
              <h2 id="home-melocoton-movimiento" className="mt-2 text-lg font-semibold leading-snug text-brand-blue sm:text-3xl">
                Melocotón en movimiento
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-600 sm:text-base sm:leading-7">
                Cada práctica tiene su historia. Descubre nuestros videos y los momentos que nos inspiran.
              </p>
              <span className="mt-3 inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-brand-blue underline underline-offset-4 sm:text-sm">
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
            <Link className="underline underline-offset-4" href="/melocoton-en-movimiento">Ver Melocotón en movimiento</Link>
          </nav>
        </div>
      </section>
      </main>
    </>
  );
}
