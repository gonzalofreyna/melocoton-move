// pages/product-detail.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../lib/fetchProducts";
import type { Product } from "../lib/fetchProducts";
import { resolveImage } from "../lib/resolveImage";
import { fetchConfig } from "../lib/fetchConfig";
import type { OfferBadgeConfig, AppConfig } from "../lib/fetchConfig";

function normalizeBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [offerBadge, setOfferBadge] = useState<OfferBadgeConfig | null>(null);
  const [featureFlags, setFeatureFlags] = useState<
    AppConfig["featureFlags"] | null
  >(null);
  const [loading, setLoading] = useState(true);

  // Estado declarado siempre (evita error de hooks)
  const [mainUrl, setMainUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const [productsData, cfg] = await Promise.all([
          fetchProducts(),
          fetchConfig(),
        ]);
        const flags = {
          ...cfg.featureFlags,
          showOfferBadge: normalizeBool(cfg.featureFlags?.showOfferBadge),
        };
        setAllProducts(productsData);
        setOfferBadge(cfg.offerBadge ?? null);
        setFeatureFlags(flags);
      } catch (e) {
        console.error("Error cargando datos en ProductDetail", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const product = useMemo(() => {
    if (!slug || !Array.isArray(allProducts)) return undefined;
    const s = String(slug).toLowerCase();
    return allProducts.find((p) => p.slug.toLowerCase() === s);
  }, [slug, allProducts]);

  // Cuando cambie de producto, fija la principal
  useEffect(() => {
    if (product?.image) setMainUrl(resolveImage(product.image));
  }, [product?.image, product?.slug]);

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

  // Dimensiones
  const dims =
    product.dimensionsCm &&
    `${product.dimensionsCm.w}×${product.dimensionsCm.l}×${product.dimensionsCm.h} cm`;

  // Stock UI
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

  // ===== Galería
  const mainImgFixed = resolveImage(product.image); // principal del producto
  const galleryArr = (product.gallery ?? [])
    .map((u) => resolveImage(u))
    .filter(Boolean);
  const allThumbs = Array.from(new Set([mainImgFixed, ...galleryArr])); // incluye principal
  const effectiveMainUrl = mainUrl || mainImgFixed;

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

  // ===== Helpers UI (badge oferta existente)
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

  // Relacionados
  const relatedSlugs = product.related ?? [];
  const related = relatedSlugs
    .map((s) => allProducts.find((p) => p.slug === s))
    .filter(Boolean) as Product[];

  return (
    <>
      {/* ===== SEO Head ===== */}
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

      {/* ===== Página ===== */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* 👉 items-start asegura alineación superior entre columnas */}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Galería */}
          <div className="space-y-4">
            {/* Imagen principal */}
            <div className="relative bg-white rounded-2xl p-6 shadow-md flex items-center justify-center">
              {BadgeOverlay}

              <img
                src={effectiveMainUrl}
                alt={`${product.name} - imagen principal`}
                className="max-h-[420px] object-contain"
                loading="eager"
                decoding="async"
              />

              {/* Franja "Envío gratis" */}
              {product.freeShipping === true && (
                <div className="absolute inset-x-0 bottom-0">
                  <div className="bg-gradient-to-t from-black/55 to-transparent">
                    <div className="py-2 text-center text-white text-xs md:text-sm font-medium tracking-wide">
                      Envío gratis
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Miniaturas grandes (≈50% de la grande) */}
            {allThumbs.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {allThumbs.map((url, i) => {
                  const isActive = url === effectiveMainUrl;
                  return (
                    <button
                      key={url + i}
                      onClick={() => setMainUrl(url)}
                      type="button"
                      className={`relative aspect-[4/3] bg-white rounded-2xl p-4 shadow-md flex items-center justify-center hover:shadow-lg hover:scale-[1.01] transition ${
                        isActive ? "ring-2 ring-brand-blue" : ""
                      }`}
                      aria-label={`Ver imagen ${i + 1} de ${product.name}`}
                      aria-pressed={isActive}
                    >
                      <img
                        src={url}
                        alt={`${product.name} - miniatura ${i + 1}`}
                        className="max-h-[210px] max-w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="flex flex-col space-y-5 self-start">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-brand-blue">
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
              <p className="text-gray-600 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {!!product.colors?.length && (
              <div className="flex items-center gap-2 mt-1">
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

            {/* Precio */}
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

            {/* CTA */}
            <button
              onClick={() =>
                addToCart({
                  slug: product.slug, // 👈 necesario
                  name: product.name,
                  image: resolveImage(product.image),
                  price: finalPrice,
                  freeShipping: product.freeShipping === true,
                  maxStock:
                    typeof product.stock === "number"
                      ? product.stock
                      : undefined,
                })
              }
              disabled={stock != null && stock <= 0}
              className="bg-brand-blue text-white py-3 px-6 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-colors disabled:opacity-50"
              title={
                stock != null && stock <= 0
                  ? "Producto agotado"
                  : typeof stock === "number"
                  ? `Stock disponible: ${stock}`
                  : undefined
              }
            >
              Agregar al carrito
            </button>

            {/* Highlights */}
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

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-brand-blue mb-4">
              También te puede gustar
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                    <div className="p-3">
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
