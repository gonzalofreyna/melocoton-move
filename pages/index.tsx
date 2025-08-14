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

export default function Home() {
  // AC desde el contexto (ya cacheado globalmente)
  const { config, loading: configLoading } = useAppConfig();

  // Evita render hasta que el AC esté listo
  if (configLoading) return null;

  // HERO: solo si el flag está activo y hay imagen
  const showHero =
    !!config?.featureFlags?.showHero && !!config?.hero?.desktopImage;

  const heroBgUrl =
    showHero && config?.hero?.desktopImage
      ? resolveImage(config.hero.desktopImage)
      : null;

  const heroOverlayEnabled = !!config?.hero?.overlay?.enabled;
  const heroOverlayOpacity = config?.hero?.overlay?.opacity ?? 0;

  // Textos del HERO desde el AC (sin fallback local)
  const heroTitle = config?.hero?.title || null;
  const heroParagraph = config?.hero?.alt || null; // p = alt, como pediste

  // Productos (tu fetch actual desde S3)
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (e) {
        console.error("Error cargando productos", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <main className="flex flex-col items-center text-center bg-gray-50">
      {/* HERO PRINCIPAL: solo desde AC (si falta algo, no se muestra) */}
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

            {/* CTA: si luego quieres leerla del AC (hero.cta), la conectamos aquí */}
            <a
              href="/products"
              className="bg-brand-beige text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-white transition-transform transform hover:scale-105 shadow-md"
            >
              Ver Productos
            </a>
          </motion.div>
        </section>
      )}

      {/* BENEFICIOS (desde AC) */}
      {config?.featureFlags?.showBenefits && config?.benefits?.enabled && (
        <section className="py-20 px-6 bg-white w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-brand-blue mb-12"
          >
            {config.benefits.header}
          </motion.h2>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-3 max-w-6xl mx-auto">
            {config.benefits.items.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="bg-gray-50 rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-bold text-brand-beige mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* PUNTOS DE VENTA (desde AC) */}
      {config?.featureFlags?.showPuntosDeVenta &&
        Array.isArray(config?.puntosDeVenta) &&
        config.puntosDeVenta.length > 0 && (
          <section className="py-20 px-6 bg-gray-50 w-full">
            {/* Título desde AC */}
            {config?.puntosDeVentaHeader?.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl font-bold text-brand-blue mb-3"
              >
                {config.puntosDeVentaHeader.title}
              </motion.h2>
            )}

            {/* Subtítulo desde AC */}
            {config?.puntosDeVentaHeader?.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-gray-600 mb-12"
              >
                {config.puntosDeVentaHeader.subtitle}
              </motion.p>
            )}

            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3 },
                1024: { slidesPerView: 5 },
              }}
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              loop={true}
              className="max-w-6xl mx-auto"
            >
              {config.puntosDeVenta.map((punto, idx) => (
                <SwiperSlide
                  key={`${punto.estado}-${idx}`}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={punto.logo} // Si algún logo fuera relativo, usar resolveImage(punto.logo)
                      alt={punto.estado}
                      className="h-16 w-auto mb-4 object-contain transition-transform duration-300 hover:scale-110"
                    />
                    <p className="text-brand-blue font-semibold">
                      {punto.estado}
                    </p>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

      {/* CATEGORÍAS (desde AC) */}
      <section className="py-20 px-6 bg-gray-50 w-full">
        <h2 className="text-3xl font-bold text-brand-blue mb-12">Categorías</h2>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {config?.categories?.map((cat, idx) => (
            <motion.a
              key={idx}
              href={cat.href}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="relative rounded-2xl overflow-hidden group shadow-md"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-500 flex items-center justify-center">
                <span className="text-white text-xl font-semibold opacity-90">
                  {cat.name}
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS (igual que antes) */}
      <section className="py-20 px-6 bg-white w-full">
        <h2 className="text-3xl font-bold text-brand-blue mb-12">Destacados</h2>

        {loading ? (
          <p className="text-gray-500">Cargando productos…</p>
        ) : featuredProducts.length === 0 ? (
          <p className="text-gray-500">No hay productos destacados.</p>
        ) : (
          <>
            <Swiper
              className="max-w-6xl mx-auto custom-swiper"
              modules={[Autoplay, Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              pagination={{ clickable: true }}
            >
              {featuredProducts.map((product, idx) => (
                <SwiperSlide key={product.slug ?? idx}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>

            <a
              href="/products"
              className="mt-12 inline-block bg-brand-blue text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-transform transform hover:scale-105 shadow-md"
            >
              Ver Todo
            </a>
          </>
        )}
      </section>

      {config?.featureFlags?.showFinalCTA && config?.finalCTA?.enabled && (
        <section
          className="relative w-full py-24 bg-fixed bg-center bg-cover text-white"
          style={{
            backgroundImage: `url(${resolveImage(
              config.finalCTA.backgroundImage
            )})`,
          }}
        >
          {/* Overlay dinámico */}
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
