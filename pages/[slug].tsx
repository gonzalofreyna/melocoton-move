// pages/product-detail.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "../context/CartContext";

import type { Product } from "../lib/fetchProducts";
import { resolveImage } from "../lib/resolveImage";
import { useProducts } from "../context/ProductsContext";
import { useAppConfig } from "../context/ConfigContext";

import { motion } from "framer-motion";
import type React from "react";

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();

  const { products, loading: productsLoading } = useProducts();
  const { config, loading: configLoading } = useAppConfig();

  // Normaliza el flag showOfferBadge si existe
  const featureFlags = config
    ? {
        ...config.featureFlags,
        showOfferBadge: config.featureFlags?.showOfferBadge === true,
      }
    : null;

  const offerBadge = config?.offerBadge ?? null;

  // Loading global para este componente
  const loading = productsLoading || configLoading;

  const [mainUrl, setMainUrl] = useState<string>("");

  const product = useMemo(() => {
    if (!slug || !products?.length) return undefined;
    const s = String(slug).toLowerCase();
    return products.find((p) => p.slug.toLowerCase() === s);
  }, [slug, products]);

  useEffect(() => {
    if (product?.image) setMainUrl(resolveImage(product.image));
  }, [product?.image, product?.slug]);

  // ===== Galería base
  const mainImgFixed = product?.image ? resolveImage(product.image) : "";
  const galleryArr =
    product?.gallery?.map((u) => resolveImage(u)).filter(Boolean) ?? [];
  const allThumbs = Array.from(new Set([mainImgFixed, ...galleryArr]));
  const effectiveMainUrl = mainUrl || mainImgFixed;

  // ===== Carrusel (refs y límites) — colocado antes de cualquier return
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragLimits, setDragLimits] = useState<{ left: number; right: number }>(
    {
      left: 0,
      right: 0,
    }
  );

  useEffect(() => {
    const update = () => {
      const track = trackRef.current;
      const container = containerRef.current;
      if (!track || !container) return;

      const isDesktop = window.innerWidth >= 1024;
      const maxDrag = Math.max(0, track.scrollWidth - container.clientWidth);

      if (isDesktop) {
        // En escritorio: drag normal pero recalculado con scrollLeft real
        const scrollLeft = container.scrollLeft;
        const leftLimit = -maxDrag - scrollLeft - 20; // pequeño margen
        const rightLimit = scrollLeft + 20;

        setDragLimits({ left: leftLimit, right: rightLimit });

        // Forzar que empiece exactamente en la primera imagen
        if (scrollLeft > 0) {
          container.scrollTo({ left: 0, behavior: "instant" });
        }

        return;
      }

      // En móvil/tablet: comportamiento normal
      setDragLimits({ left: -maxDrag, right: 0 });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [allThumbs.length]);

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // ===== Returns condicionales después de todos los hooks
  if (loading || !slug)
    return <p className="text-center py-20">Cargando producto…</p>;

  if (!product)
    return <p className="text-center py-20">Producto no encontrado.</p>;

  // ===== Precios
  const full = Number(product.fullPrice);
  const disc =
    product.discountPrice != null ? Number(product.discountPrice) : undefined;
  const hasValidDiscount =
    Number.isFinite(disc) &&
    (disc as number) > 0 &&
    Number((disc as number).toFixed(2)) < Number(full.toFixed(2));
  const finalPrice = hasValidDiscount ? (disc as number) : full;

  const dims =
    product.dimensionsCm &&
    `${product.dimensionsCm.w}×${product.dimensionsCm.l}×${product.dimensionsCm.h} cm`;

  const stock = product.stock;
  const stockLabel =
    stock == null
      ? null
      : stock <= 0
      ? "Agotado"
      : stock <= 5
      ? "Pocas piezas"
      : "Disponible";
  const stockClass =
    stock == null
      ? ""
      : stock <= 0
      ? "bg-red-100 text-red-700"
      : stock <= 5
      ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-700";

  // ====== SEO
  const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://main.d15wjbc4ifk2rq.amplifyapp.com"
  ).replace(/\/$/, "");
  const canonical = `${SITE_URL}/${product.slug}`;
  const title = `${product.name} | Melocotón Move`;
  const description = (
    product.description ||
    "Productos de pilates con estilo, agarre y comodidad."
  ).slice(0, 155);

  const ldImages = Array.from(new Set([mainImgFixed, ...galleryArr]));
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: ldImages,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand || "Melocotón Move" },
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: finalPrice,
      availability:
        stock != null && stock <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: canonical,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category,
        item: `${SITE_URL}/category/${encodeURIComponent(product.category)}`,
      },
      { "@type": "ListItem", position: 3, name: product.name, item: canonical },
    ],
  };

  // ===== Helpers UI
  const shouldShowBadge =
    featureFlags?.showOfferBadge === true &&
    (offerBadge?.enabled as boolean) === true &&
    hasValidDiscount;

  const positionClass = (() => {
    switch (offerBadge?.position) {
      case "top-left":
        return "top-3 left-3";
      case "top-right":
        return "top-3 right-3";
      case "bottom-left":
        return "bottom-3 left-3";
      case "bottom-right":
        return "bottom-3 right-3";
      default:
        return "top-3 left-3";
    }
  })();

  const textContent = offerBadge?.uppercase
    ? (offerBadge?.text ?? "Promoción").toUpperCase()
    : offerBadge?.text ?? "Promoción";

  const pillClassFromSize = (() => {
    const base = "px-3 py-1 text-xs";
    if (offerBadge?.size === "md") return "px-3.5 py-1.5 text-sm";
    if (offerBadge?.size === "lg") return "px-4 py-2 text-base";
    return base;
  })();

  const pillRadiusFromShape =
    offerBadge?.shape === "pill" ? "rounded-full" : "rounded-md";
  const pillInlineStyle = {
    backgroundColor: offerBadge?.colors?.bg || "#111827",
    color: offerBadge?.colors?.text || "#ffffff",
    borderColor: offerBadge?.colors?.border || "transparent",
    borderWidth: offerBadge?.colors?.border ? 1 : 0,
    borderStyle: offerBadge?.colors?.border ? ("solid" as const) : undefined,
  };

  const iconSizePx = offerBadge?.icon?.size ?? 32;
  const BadgeOverlay = shouldShowBadge ? (
    <div className={`absolute z-10 ${positionClass} flex items-center gap-2`}>
      {offerBadge?.mode === "icon" &&
      offerBadge?.icon?.enabled &&
      offerBadge?.icon?.src ? (
        <img
          src={offerBadge.icon.src}
          alt={offerBadge.icon.alt || "Oferta"}
          width={iconSizePx}
          height={iconSizePx}
          style={{ width: iconSizePx, height: iconSizePx }}
        />
      ) : (
        <div
          className={`${pillClassFromSize} ${pillRadiusFromShape}`}
          style={pillInlineStyle}
        >
          {textContent}
        </div>
      )}
    </div>
  ) : null;

  const relatedSlugs = product.related ?? [];
  const related = relatedSlugs
    .map((s) => products.find((p) => p.slug === s))
    .filter(Boolean) as Product[];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={effectiveMainUrl} />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      </Head>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* ===== Galería ===== */}
          {/* ===== Galería ===== */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl p-4 sm:p-6 shadow-md flex items-center justify-center">
              {BadgeOverlay}
              <motion.img
                key={effectiveMainUrl}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                src={effectiveMainUrl}
                alt={`${product.name} - imagen principal`}
                className="w-full max-h-[320px] sm:max-h-[420px] object-contain"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* ===== Carrusel ===== */}
            {allThumbs.length > 0 && (
              <div className="mt-4">
                <div
                  ref={containerRef}
                  className="relative overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide scroll-smooth max-w-full"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <motion.div
                    ref={trackRef}
                    className="flex gap-3 cursor-grab active:cursor-grabbing sm:justify-start min-w-max"
                    style={
                      {
                        touchAction: "pan-x",
                        userSelect: "none",
                        // @ts-ignore
                        WebkitUserDrag: "none",
                      } as React.CSSProperties
                    }
                    whileTap={{ cursor: "grabbing" }}
                    onWheel={onWheel}
                  >
                    {allThumbs.map((url, i) => {
                      const isActive = url === effectiveMainUrl;
                      return (
                        <button
                          key={url + i}
                          onClick={() => setMainUrl(url)}
                          type="button"
                          className={`snap-start shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl border ${
                            isActive
                              ? "border-brand-blue ring-2 ring-brand-blue/20"
                              : "border-gray-200"
                          } bg-white overflow-hidden transition-transform duration-200 hover:scale-105`}
                          aria-label={`Ver imagen ${i + 1} de ${product.name}`}
                          aria-pressed={isActive}
                        >
                          <img
                            src={url}
                            alt={`${product.name} - miniatura ${i + 1}`}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Indicadores */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  {allThumbs.map((url, i) => {
                    const isActive = url === effectiveMainUrl;
                    return (
                      <span
                        key={"dot-" + i}
                        className={`inline-block w-2 h-2 rounded-full transition-colors ${
                          isActive ? "bg-brand-blue" : "bg-gray-300"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== Precio, colores y botón debajo de la galería ===== */}
            <div className="flex flex-col space-y-4 pt-2">
              {!!product.colors?.length && (
                <div className="flex items-center gap-2">
                  {product.colors.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              <div>
                {hasValidDiscount ? (
                  <>
                    <p className="text-brand-blue font-bold text-2xl">
                      {(disc as number).toFixed(2)} MXN
                    </p>
                    <p className="text-gray-400 line-through">
                      {full.toFixed(2)} MXN
                    </p>
                  </>
                ) : (
                  <p className="text-brand-beige font-bold text-2xl">
                    {full.toFixed(2)} MXN
                  </p>
                )}
              </div>

              <button
                onClick={() =>
                  addToCart({
                    slug: product.slug,
                    name: product.name,
                    image: resolveImage(product.image),
                    price: finalPrice,
                    freeShipping: product.freeShipping === true,
                    maxStock:
                      typeof product.stock === "number"
                        ? product.stock
                        : undefined,
                    shippingType: product.shippingType || "standard", // 🧩 agregado
                  })
                }
                disabled={stock != null && stock <= 0}
                className="bg-brand-blue text-white py-3 px-6 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-colors disabled:opacity-50"
              >
                Agregar al carrito
              </button>
            </div>
          </div>

          {/* ===== Detalles ===== */}
          <div className="flex flex-col space-y-5 self-start">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue">
                {product.name}
              </h1>
              {stockLabel && (
                <span
                  className={`px-2.5 py-1 text-xs rounded-full border ${stockClass}`}
                >
                  {stockLabel}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-gray-600 whitespace-pre-line text-sm sm:text-base">
                {product.description}
              </p>
            )}

            {Array.isArray(product.highlights) &&
              product.highlights.length > 0 && (
                <ul className="mt-2 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  {product.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

            {/* Acordeones */}
            <div className="divide-y rounded-xl border bg-white overflow-hidden">
              {(dims ||
                product.weightGrams ||
                product.sku ||
                product.materials?.length) && (
                <details open className="group p-4">
                  <summary className="cursor-pointer font-semibold text-brand-blue outline-none">
                    Especificaciones
                  </summary>
                  <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {product.sku && (
                      <>
                        <dt className="text-gray-500">SKU</dt>
                        <dd>{product.sku}</dd>
                      </>
                    )}
                    {product.brand && (
                      <>
                        <dt className="text-gray-500">Marca</dt>
                        <dd>{product.brand}</dd>
                      </>
                    )}
                    {dims && (
                      <>
                        <dt className="text-gray-500">Dimensiones</dt>
                        <dd>{dims}</dd>
                      </>
                    )}
                    {product.weightGrams && (
                      <>
                        <dt className="text-gray-500">Peso</dt>
                        <dd>{product.weightGrams} g</dd>
                      </>
                    )}
                    {product.materials && product.materials.length > 0 && (
                      <>
                        <dt className="text-gray-500">Materiales</dt>
                        <dd>{product.materials.join(", ")}</dd>
                      </>
                    )}
                  </dl>
                </details>
              )}

              {product.care && product.care.length > 0 && (
                <details className="p-4">
                  <summary className="cursor-pointer font-semibold text-brand-blue">
                    Cuidados
                  </summary>
                  <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
                    {product.care.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </details>
              )}

              {(product.shippingEstimate ||
                product.returnDays ||
                product.warrantyMonths) && (
                <details className="p-4">
                  <summary className="cursor-pointer font-semibold text-brand-blue">
                    Envío y devoluciones
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    {product.shippingEstimate && (
                      <p>
                        Entrega estimada de equipos personalizados:{" "}
                        {product.shippingEstimate.minBusinessDays}–
                        {product.shippingEstimate.maxBusinessDays} días hábiles.
                      </p>
                    )}
                    <p>
                      Entrega estimada de equipos en stock: 5-10 días hábiles.
                    </p>
                    <p>Pregunta por las entregas sin costo en CDMX y GDL.</p>
                    {product.returnDays && (
                      <p>
                        Recibe el producto que esperabas o te devolvemos tu
                        dinero.
                      </p>
                    )}
                    {product.warrantyMonths && (
                      <p>
                        Garantía contra defectos por {product.warrantyMonths}{" "}
                        meses.
                      </p>
                    )}
                  </div>
                </details>
              )}

              {product.whatsIncluded && product.whatsIncluded.length > 0 && (
                <details className="p-4">
                  <summary className="cursor-pointer font-semibold text-brand-blue">
                    ¿Qué incluye?
                  </summary>
                  <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
                    {product.whatsIncluded.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* ===== Relacionados ===== */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-blue mb-4">
              También te puede gustar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => {
                const price = p.discountPrice ?? p.fullPrice;
                return (
                  <Link
                    key={p.slug}
                    href={`/${p.slug}`}
                    className="block bg-white rounded-xl shadow hover:shadow-md overflow-hidden"
                  >
                    <div className="aspect-square flex items-center justify-center bg-white">
                      <img
                        src={resolveImage(p.image)}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="p-3 text-center sm:text-left">
                      <p className="font-medium text-brand-blue">{p.name}</p>
                      <p className="text-sm text-gray-600">
                        ${price.toFixed(2)} MXN
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
