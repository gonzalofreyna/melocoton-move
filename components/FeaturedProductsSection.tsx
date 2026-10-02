"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
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

  const groupedFeaturedProducts = Object.values(
    featuredProducts.reduce<Record<string, typeof featuredProducts>>(
      (groups, product) => {
        const key = product.name.trim().toLowerCase().replace(/\s+/g, " ");

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(product);

        return groups;
      },
      {},
    ),
  );

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-brand-blue mb-8 sm:mb-12">
        Destacados
      </h2>

      {loading ? (
        <p className="text-gray-500">Cargando productos…</p>
      ) : groupedFeaturedProducts.length === 0 ? (
        <p className="text-gray-500">No hay productos destacados.</p>
      ) : (
        <>
          {/* 🌀 Swiper con breakpoints responsive */}
          <Swiper
            className="max-w-6xl mx-auto custom-swiper featured-products-swiper py-4"
            modules={[Navigation]}
            spaceBetween={16}
            loop={true}
            navigation
            breakpoints={{
              0: { slidesPerView: 2, spaceBetween: 12 },
              640: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 2, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 24 },
            }}
          >
            {groupedFeaturedProducts.map((variants, idx) => {
              const product = variants[0];

              return (
                <SwiperSlide key={product.slug ?? idx} className="py-2">
                  <ProductCard
                    product={product}
                    variants={variants}
                    offerBadge={config?.offerBadge}
                    featureFlags={config?.featureFlags}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* CTA Ver Todo */}
          <Link
            href="/products"
            className="mt-10 sm:mt-12 inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-brand-blue hover:text-brand-beige transition-colors"
          >
            Ver todos
            <span aria-hidden="true">→</span>
          </Link>
        </>
      )}
    </section>
  );
}
