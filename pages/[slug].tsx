// pages/product-detail.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "../context/CartContext";
import { ADS_CONSENT_EVENT } from "../components/AdsConsentBanner";
import { reportGa4ProductView } from "../lib/ga4Ecommerce";

import type { Product } from "../lib/fetchProducts";
import { resolveImage } from "../lib/resolveImage";
import { categoryHref } from "../lib/categoryHref";
import { useProducts } from "../context/ProductsContext";
import { useAppConfig } from "../context/ConfigContext";

import { motion } from "framer-motion";
import type React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";

type ProductPageProps = { initialProduct: Product; initialVariants: Product[]; initialRelated: Product[] };

// Generación bajo demanda de slugs nuevos, con revalidación cada 30 minutos.
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps<ProductPageProps> = async ({ params }) => {
  const slug = String(params?.slug ?? "").toLowerCase();
  const { fetchProducts } = await import("../lib/fetchProducts");
  const products = await fetchProducts({ fresh: true });
  const initialProduct = products.find((item) => item.slug.toLowerCase() === slug);

  if (!initialProduct) return { notFound: true, revalidate: 60 };
  // Entregar enlaces a colores en el HTML inicial sin esperar el fetch del navegador.
  const productKey = initialProduct.name.trim().toLowerCase().replace(/\s+/g, " ");
  const initialVariants = products.filter((item) =>
    item.name.trim().toLowerCase().replace(/\s+/g, " ") === productKey,
  );
  const relatedSlugs = new Set(initialProduct.related ?? []);
  const initialRelated = products.filter((item) => relatedSlugs.has(item.slug) && item.slug !== initialProduct.slug);
  return {
    props: {
      initialProduct: JSON.parse(JSON.stringify(initialProduct)) as Product,
      initialVariants: JSON.parse(JSON.stringify(initialVariants)) as Product[],
      initialRelated: JSON.parse(JSON.stringify(initialRelated)) as Product[],
    },
    revalidate: 1800,
  };
};

export default function ProductDetail({ initialProduct, initialVariants, initialRelated }: ProductPageProps) {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();

  const { products, loading: productsLoading } = useProducts();
  const { config } = useAppConfig();

  // Normaliza el flag showOfferBadge si existe
  const featureFlags = config
    ? {
        ...config.featureFlags,
        showOfferBadge: config.featureFlags?.showOfferBadge === true,
      }
    : null;

  const offerBadge = config?.offerBadge ?? null;

  // Loading global para este componente
  const loading = productsLoading && !initialProduct;

  const [mainUrl, setMainUrl] = useState<string>("");

  const product = useMemo(() => {
    if (!slug) return initialProduct;
    const s = String(slug).toLowerCase();
    return products.find((p) => p.slug.toLowerCase() === s) ?? initialProduct;
  }, [slug, products, initialProduct]);

  // Solo una vista de ecommerce por navegación; el producto debe coincidir
  // con el slug de la ruta, incluso mientras se actualiza el catálogo.
  const reportedView = useRef<string | null>(null);
  useEffect(() => {
    if (!router.isReady || !product || !slug) return;
    const routeSlug = String(slug).toLowerCase();
    if (product.slug.toLowerCase() !== routeSlug) return;
    const viewKey = router.asPath;
    const full = Number(product.fullPrice);
    const discount = product.discountPrice == null ? NaN : Number(product.discountPrice);
    const validDiscount = Number.isFinite(discount) && discount > 0 &&
      Number.isFinite(full) && Number(discount.toFixed(2)) < Number(full.toFixed(2));
    const price = validDiscount ? discount : full;
    if (!Number.isFinite(price) || price < 0) return;
    const send = () => {
      if (reportedView.current === viewKey) return;
      if (reportGa4ProductView({
        item_id: product.sku?.trim() || product.slug,
        item_name: product.name,
        item_category: product.category,
        price,
      })) reportedView.current = viewKey;
    };
    send();
    window.addEventListener(ADS_CONSENT_EVENT, send);
    window.addEventListener("melocoton:ga4-ready", send);
    return () => {
      window.removeEventListener(ADS_CONSENT_EVENT, send);
      window.removeEventListener("melocoton:ga4-ready", send);
    };
  }, [router.isReady, router.asPath, slug, product?.slug, product?.sku,
      product?.name, product?.category, product?.fullPrice, product?.discountPrice]);

  const variants = useMemo(() => {
    if (!product) return [];
    if (!products.length) return initialVariants.length ? initialVariants : [product];

    const productKey = product.name.trim().toLowerCase().replace(/\s+/g, " ");

    return products.filter((p) => {
      const key = p.name.trim().toLowerCase().replace(/\s+/g, " ");

      return key === productKey;
    });
  }, [product, products, initialVariants]);

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
    },
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

  // ====== SEO
  const SITE_URL = "https://www.melocotonmove.com";
  const canonical = `${SITE_URL}/${product.slug}`;
  // Las variantes Magic Ring y Mini Ball comparten nombre comercial,
  // pero requieren títulos y descripciones SEO propios por color.
  const variantColorBySlug: Record<string, string> = {
    magicringsiliconnegro: "Negro",
    "magic-ring-pilates-negro": "Negro",
    magicringsiliconnude: "Nude",
    "magic-ring-pilates-nude": "Nude",
    magicringsiliconrosa: "Rosa",
    "magic-ring-pilates-rosa": "Rosa",
    magicringsiliconazul: "Azul",
    "magic-ring-pilates-azul": "Azul",
    magicringsiliconnaranja: "Naranja",
    "magic-ring-pilates-naranja": "Naranja",
    magicringsiliconarena: "Arena",
    "magic-ring-pilates-arena": "Arena",
    "mini-ball-pilates-negra": "Negra",
    "mini-ball-pilates-nude": "Nude",
    "mini-ball-pilates-rosa": "Rosa",
    "mini-ball-pilates-azul": "Azul",
    "mini-ball-pilates-naranja": "Naranja",
    "mini-ball-pilates-arena": "Arena",
  };
  const variantColor = variantColorBySlug[product.slug.toLowerCase()];
  const seoProductName = variantColor
    ? `${product.name} ${variantColor}`
    : product.name;
  // El título de mats comunica la intención de búsqueda sin modificar el nombre comercial visible.
  const seoTitleName = product.category === "mat" && /^Mat Profesional\b/i.test(seoProductName)
    ? seoProductName.replace(/^Mat Profesional\b/i, "Tapete Yoga y Pilates")
    : seoProductName;
  const commercialTitleName = product.category === "calcetas"
    ? seoTitleName.replace(/^Calceta(?:s)? Antiderrapante(?:s)?\b/i, "Calcetas Antideslizantes")
    : seoTitleName;
  // Títulos concisos de Mini Ball: intención Pilates, medida y color reales.
  const searchTitleName = product.slug.toLowerCase().startsWith("mini-ball-pilates-") && variantColor
    ? `Mini Ball Pilates 20 cm ${variantColor}`
    : commercialTitleName;
  const title = `${searchTitleName} | Melocotón Move`;
  const categoryKeyword =
    product.category === "mat"
      ? "tapete de yoga y Pilates"
      : product.category === "calcetas"
        ? "calcetas antideslizantes para Pilates"
        : "";
  const rawDescription = product.description.replace(/\s+/g, " ").trim();
  const seoLead = categoryKeyword
    ? `${seoProductName}: ${categoryKeyword} de Melocotón Move.`
    : seoProductName + " de Melocotón Move.";
  // Las fichas sin texto descriptivo siguen teniendo una descripción específica.
  // Reservamos espacio para el texto real del catálogo sin inventar atributos.
  const remaining = 155 - seoLead.length - 1;
  const excerpt = remaining > 25 && rawDescription
    ? rawDescription.slice(0, remaining).replace(/\s+\S*$/, "").trim()
    : "";
  const description = excerpt ? `${seoLead} ${excerpt}` : seoLead;

  const ldImages = Array.from(new Set([mainImgFixed, ...galleryArr]));
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: seoProductName,
    image: ldImages,
    description: product.description.trim() || description,
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { "@type": "Brand", name: product.brand || "Melocotón Move" },
    // Sólo publicar atributos que existen en los datos reales del catálogo.
    ...(product.colors?.length ? { color: product.colors.join(", ") } : {}),
    ...(product.materials?.length ? { material: product.materials.join(", ") } : {}),
    ...(typeof product.weightGrams === "number" && product.weightGrams > 0
      ? { weight: { "@type": "QuantitativeValue", value: product.weightGrams, unitCode: "GRM" } }
      : {}),
    ...(product.category === "calcetas"
      ? { category: "Calcetas antideslizantes para Pilates", size: "Unitalla" }
      : product.category === "mat"
        ? { category: "Tapetes de yoga y Pilates" }
        : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: finalPrice,
      // Sin dato de inventario, no afirmamos disponibilidad en buscadores.
      ...(stock != null
        ? { availability: stock <= 0
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock" }
        : {}),
      url: canonical,
    },
  };

  const categoryName = product.category === "mat"
    ? "Tapetes de yoga y Pilates"
    : product.category === "calcetas"
      ? "Calcetas antideslizantes para Pilates"
      : "Productos";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${SITE_URL}${categoryHref(product.category)}`,
      },
      { "@type": "ListItem", position: 3, name: seoProductName, item: canonical },
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
    : (offerBadge?.text ?? "Promoción");

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
  // Conservar los enlaces a productos relacionados en el HTML inicial.
  const relatedCatalog = products.length ? products : [initialProduct, ...initialRelated];
  const related = relatedSlugs
    .map((s) => relatedCatalog.find((p) => p.slug === s))
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
        <meta property="og:locale" content="es_MX" />
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

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:underline">Inicio</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <Link href={categoryHref(product.category)} className="hover:underline">
            {categoryName}
          </Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span aria-current="page" className="text-gray-800">{seoProductName}</span>
        </nav>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* ===== Galería ===== */}
          {/* ===== Galería ===== */}
          <div className="space-y-4">
            <div className="mm-card relative flex items-center justify-center bg-white p-4 sm:p-7">
              {BadgeOverlay}
              <motion.img
                key={effectiveMainUrl}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                src={effectiveMainUrl}
                alt={`${seoProductName} - imagen principal`}
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
              {variants.length > 1 && (
                <div className="flex items-center gap-3">
                  {variants.map((variant) => {
                    const color = variant.colors?.[0];
                    const isSelected = variant.slug === product.slug;

                    if (!color) return null;

                    return (
                      <Link
                        key={variant.slug}
                        href={`/${variant.slug}`}
                        aria-label={`Ver ${variant.name} en color ${color}`}
                        aria-current={isSelected ? "page" : undefined}
                        title={variant.name}
                        className={`inline-block h-7 w-7 shrink-0 rounded-full border transition-all ${
                          isSelected
                            ? "ring-2 ring-brand-blue ring-offset-2 border-white"
                            : "border-gray-300 hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    );
                  })}
                </div>
              )}

              <div>
                {hasValidDiscount ? (
                  <>
                    <p className="text-brand-ink text-2xl font-semibold">
                      {(disc as number).toFixed(2)} MXN
                    </p>
                    <p className="text-gray-400 line-through">
                      {full.toFixed(2)} MXN
                    </p>
                  </>
                ) : (
                  <p className="text-brand-wine text-2xl font-semibold">
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
                className="mm-button px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Agregar al carrito
              </button>
            </div>
          </div>

          {/* ===== Detalles ===== */}
          <div className="flex flex-col space-y-5 self-start">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="mm-heading text-3xl sm:text-4xl">
                {seoProductName}
              </h1>
            </div>

            {product.description && (
              <p className="text-gray-600 whitespace-pre-line text-sm sm:text-base">
                {product.description}
              </p>
            )}

            {product.category === "mat" && (
              <nav
                aria-label="Información para elegir y personalizar tu mat"
                className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm"
              >
                <Link className="mm-text-link" href="/guia-elegir-tapete-yoga-pilates">
                  Cómo elegir tu tapete
                </Link>
                <Link className="mm-text-link" href="/crea-tu-mat">
                  Personaliza un mat con tu logo
                </Link>
              </nav>
            )}

            {product.category === "calcetas" && (
              <section aria-label="Talla y guía de calcetas" className="rounded-2xl border border-brand-line bg-brand-sand p-5">
                <p className="text-sm text-gray-800">
                  <strong>Talla: Unitalla.</strong> Consulta el diseño y la composición de esta variante en su ficha antes de elegir.
                </p>
                <Link href="/guia-calcetas-antideslizantes-pilates" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-blue underline underline-offset-4">
                  Cómo elegir calcetas para Pilates reformer y barre
                </Link>
              </section>
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
