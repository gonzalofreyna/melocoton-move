"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { useProducts } from "../context/ProductsContext";
import { useAppConfig } from "../context/ConfigContext";

export default function FeaturedProductsSection() {
  const { products, loading: productsLoading } = useProducts();
  const { config, loading: configLoading } = useAppConfig();

  const loading = productsLoading || configLoading;

  // 🩷 Filtra los productos destacados
  const featuredProducts = products.filter((p) => p.featured === true);

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-brand-blue mb-8 sm:mb-12">
        Destacados
      </h2>

      {loading ? (
        <p className="text-gray-500">Cargando productos…</p>
      ) : featuredProducts.length === 0 ? (
        <p className="text-gray-500">No hay productos destacados.</p>
      ) : (
        <>
          {/* 🌀 Swiper con breakpoints responsive */}
          <Swiper
            className="max-w-6xl mx-auto custom-swiper"
            modules={[Autoplay, Pagination]}
            spaceBetween={16}
            loop={true}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{
              0: { slidesPerView: 2, spaceBetween: 12 },
              640: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 2, spaceBetween: 18 },
              1024: { slidesPerView: 3, spaceBetween: 20 },
            }}
          >
            {featuredProducts.map((product, idx) => (
              <SwiperSlide key={product.slug ?? idx}>
                <ProductCard
                  product={product}
                  offerBadge={config?.offerBadge}
                  featureFlags={config?.featureFlags}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* CTA Ver Todo */}
          <Link
            href="/products"
            className="mt-10 sm:mt-12 inline-block bg-brand-blue text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-transform transform hover:scale-105 shadow-md"
          >
            Ver Todo
          </Link>
        </>
      )}
    </section>
  );
}
