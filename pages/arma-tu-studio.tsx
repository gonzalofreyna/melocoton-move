import Head from "next/head";
import { useEffect, useState } from "react";
import { fetchProducts } from "../lib/fetchProducts";
import type { Product } from "../lib/fetchProducts";
import { fetchConfig } from "../lib/fetchConfig";
import type { AppConfig } from "../lib/fetchConfig";

type QuoteMode = "guided" | "free" | null;

type StudioType = string | null;
type RecommendedProduct = {
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  availableColors: string[];
  selectedColor: string;
  note?: string;
};

type QuoteItem = RecommendedProduct;

function getProductIdentifier(product: any) {
  return String(product.slug ?? product.id ?? product.name);
}

function getProductPrice(product: any) {
  return (
    Number(product.discountPrice ?? product.fullPrice ?? product.price ?? 0) ||
    0
  );
}

function getProductColors(product: any) {
  const rawColors =
    product.availableColors ?? product.colors ?? product.colorOptions ?? [];

  const colors = Array.isArray(rawColors)
    ? rawColors
        .map((color: any) =>
          typeof color === "string"
            ? color
            : (color?.label ?? color?.name ?? color?.value),
        )
        .filter(Boolean)
    : [];

  return colors.length > 0 ? colors : ["Color único"];
}

function getRecommendedQuantity(product: Product, capacity: number) {
  switch (product.quoteQuantityType) {
    case "fixed":
      return product.quoteFixedQuantity ?? 1;

    case "halfCapacity":
      return Math.ceil(capacity / 2);

    case "quarterCapacity":
      return Math.ceil(capacity / 4);

    case "capacity":
    default:
      return capacity;
  }
}

function productToQuoteItem(
  product: Product,
  quantity = 1,
  note?: string,
): QuoteItem {
  const colors = getProductColors(product);

  return {
    name: product.name,
    image: product.image,
    quantity,
    unitPrice: getProductPrice(product),
    availableColors: colors,
    selectedColor: colors[0],
    note,
  };
}

function getRecommendedProductsFromCatalog(
  studioType: StudioType,
  capacity: number,
  products: Product[],
): RecommendedProduct[] {
  if (!studioType) return [];

  return products
    .filter((product) => product.studioTypes?.includes(studioType))
    .map((product) =>
      productToQuoteItem(
        product,
        getRecommendedQuantity(product, capacity),
        product.quoteNote,
      ),
    );
}

export default function ArmaTuStudioPage() {
  const [mode, setMode] = useState<QuoteMode>(null);
  const [studioType, setStudioType] = useState<StudioType>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [step, setStep] = useState<"start" | "summary">("start");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  const recommendedProducts =
    studioType && capacity
      ? getRecommendedProductsFromCatalog(studioType, capacity, allProducts)
      : [];
  const studioOptions =
    config?.studioQuote?.studioTypes?.filter((item) => item.enabled) ?? [];
  const quoteAllowedCategories = ["reformers", "accesorios"];

  const quoteAvailableProducts = allProducts.filter((product) =>
    quoteAllowedCategories.includes(product.category),
  );

  const productSearchResults = productSearchQuery.trim()
    ? quoteAvailableProducts.filter((product) => {
        const query = productSearchQuery.toLowerCase().trim();

        return (
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      })
    : quoteAvailableProducts;
  useEffect(() => {
    const loadData = async () => {
      try {
        setProductsLoading(true);
        setConfigLoading(true);

        const [productsData, configData] = await Promise.all([
          fetchProducts(),
          fetchConfig(),
        ]);

        setAllProducts(productsData);
        setConfig(configData);
      } catch (error) {
        console.error("Error cargando datos para cotizador:", error);
      } finally {
        setProductsLoading(false);
        setConfigLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;

    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(safeValue);
  };

  const getItemSubtotal = (item: QuoteItem) => {
    return item.quantity * item.unitPrice;
  };

  const getItemDiscount = (item: QuoteItem) => {
    const subtotal = getItemSubtotal(item);

    return item.quantity >= 5 ? subtotal * 0.15 : 0;
  };

  const getItemTotal = (item: QuoteItem) => {
    return getItemSubtotal(item) - getItemDiscount(item);
  };

  const quoteTotal = quoteItems.reduce((total, item) => {
    return total + getItemTotal(item);
  }, 0);
  const whatsappPhone = "523310125501";

  const whatsappMessage =
    quoteItems.length > 0
      ? [
          mode === "guided" && studioType && capacity
            ? `Hola, quiero cotizar un estudio ${studioType} para ${capacity} alumnas.`
            : "Hola, quiero cotizar estos productos para mi estudio.",
          "",
          "Productos:",
          ...quoteItems.map(
            (item) =>
              `- ${item.quantity} ${item.name}${
                item.selectedColor ? ` color ${item.selectedColor}` : ""
              } — ${formatCurrency(getItemTotal(item))}${
                item.quantity >= 5 ? " (15% off aplicado)" : ""
              }`,
          ),
          "",
          `Total estimado: ${formatCurrency(quoteTotal)}`,
          "",
          "Nota: Esta cotización es estimada y puede ajustarse según colores, disponibilidad, personalización y envío.",
        ].join("\n")
      : "";

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  const resetAll = () => {
    setMode(null);
    setStudioType(null);
    setCapacity(null);
    setStep("start");
    setQuoteItems([]);
  };
  const isProductInQuote = (product: Product) => {
    return quoteItems.some((item) => item.name === product.name);
  };
  const addProductToQuote = (product: Product) => {
    const newItem = productToQuoteItem(product, 1, "Agregado manualmente");

    setQuoteItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (item) => item.name === newItem.name,
      );

      if (alreadyExists) {
        return currentItems.map((item) =>
          item.name === newItem.name
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [...currentItems, newItem];
    });

    setProductSearchQuery("");
    setIsProductSearchOpen(true);
  };

  const removeQuoteItem = (productName: string) => {
    setQuoteItems((currentItems) =>
      currentItems.filter((item) => item.name !== productName),
    );
  };
  const updateQuoteItemQuantity = (productName: string, change: number) => {
    setQuoteItems((currentItems) =>
      currentItems
        .map((item) =>
          item.name === productName
            ? {
                ...item,
                quantity: item.quantity + change,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };
  const updateQuoteItemColor = (productName: string, color: string) => {
    setQuoteItems((currentItems) =>
      currentItems.map((item) =>
        item.name === productName
          ? {
              ...item,
              selectedColor: color,
            }
          : item,
      ),
    );
  };

  return (
    <>
      <Head>
        <title>Arma tu Studio | Melocotón Move</title>
        <meta
          name="description"
          content="Cotiza y arma tu estudio de pilates, barre o mat pilates con Melocotón Move."
        />
      </Head>

      <main className="min-h-screen bg-white pt-40 px-4 pb-20">
        <section className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-beige">
              Cotizador
            </p>

            <h1 className="mt-4 text-4xl md:text-6xl font-semibold text-brand-blue">
              Arma tu Studio
            </h1>

            <p className="mt-6 text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Crea una cotización personalizada para montar tu estudio de
              Pilates Reformer, Barre, Mat Pilates o un espacio mixto.
            </p>
          </div>

          {!mode && (
            <div className="mt-12 grid gap-5 md:grid-cols-2 max-w-4xl mx-auto">
              <button
                type="button"
                onClick={() => {
                  setMode("guided");
                  setStep("start");
                }}
                className="rounded-3xl border border-brand-blue p-8 text-left text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
              >
                <span className="block text-2xl font-semibold">
                  Quiero una recomendación
                </span>

                <span className="mt-4 block text-sm md:text-base opacity-80">
                  Te ayudamos a elegir qué comprar según el tipo y tamaño de
                  estudio que quieres montar.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("free");
                  setStep("summary");
                  setStudioType(null);
                  setCapacity(null);
                  setQuoteItems([]);
                }}
                className="rounded-3xl border border-brand-blue p-8 text-left text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
              >
                <span className="block text-2xl font-semibold">
                  Quiero elegir libremente
                </span>

                <span className="mt-4 block text-sm md:text-base opacity-80">
                  Selecciona productos, cantidades y colores a tu manera.
                </span>
              </button>
            </div>
          )}

          {(mode === "guided" || mode === "free") && (
            <div className="mt-12 max-w-4xl mx-auto rounded-3xl border border-gray-200 p-8">
              <button
                type="button"
                onClick={resetAll}
                className="text-sm text-brand-blue underline mb-6"
              >
                Volver
              </button>

              {mode === "guided" && step === "start" && (
                <>
                  <h2 className="text-3xl font-semibold text-brand-blue">
                    ¿Qué tipo de estudio quieres montar?
                  </h2>

                  <p className="mt-3 text-gray-600">
                    Primero vamos a elegir el tipo de estudio. Después
                    calcularemos cantidades y productos recomendados.
                  </p>

                  {configLoading && (
                    <p className="mt-6 text-sm text-gray-500">
                      Cargando opciones de estudio...
                    </p>
                  )}

                  {!configLoading && studioOptions.length === 0 && (
                    <p className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                      No hay tipos de estudio configurados todavía.
                    </p>
                  )}

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {studioOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setStudioType(option.value);
                          setCapacity(null);
                        }}
                        className={
                          studioType === option.value
                            ? "rounded-2xl border border-brand-blue bg-brand-blue p-5 text-left text-white transition-colors"
                            : "rounded-2xl border border-gray-200 p-5 text-left text-brand-blue hover:border-brand-blue hover:bg-gray-50 transition-colors"
                        }
                      >
                        <span className="font-semibold">{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {studioType && (
                    <div className="mt-10 border-t border-gray-200 pt-8">
                      <h3 className="text-2xl font-semibold text-brand-blue">
                        ¿Para cuántas alumnas quieres equipar el estudio?
                      </h3>

                      <p className="mt-2 text-gray-600">
                        Esto nos ayuda a calcular cantidades recomendadas.
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                        {[4, 6, 8, 10, 12].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setCapacity(option)}
                            className={
                              capacity === option
                                ? "rounded-2xl border border-brand-blue bg-brand-blue px-5 py-4 text-white transition-colors"
                                : "rounded-2xl border border-gray-200 px-5 py-4 text-brand-blue hover:border-brand-blue hover:bg-gray-50 transition-colors"
                            }
                          >
                            {option} alumnas
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {studioType &&
                    capacity &&
                    !productsLoading &&
                    recommendedProducts.length === 0 && (
                      <div className="mt-10 rounded-3xl bg-gray-50 p-6 text-gray-500">
                        No hay productos configurados para {studioType} todavía.
                      </div>
                    )}
                  {studioType && capacity && recommendedProducts.length > 0 && (
                    <div className="mt-10 rounded-3xl bg-gray-50 p-6 md:p-8">
                      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-brand-beige">
                            Recomendación inicial
                          </p>

                          <h3 className="mt-2 text-2xl font-semibold text-brand-blue">
                            {studioType} para {capacity} alumnas
                          </h3>
                        </div>

                        <p className="text-sm text-gray-500">
                          Podrás ajustar cantidades y colores después.
                        </p>
                      </div>

                      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        {recommendedProducts.map((product) => (
                          <div
                            key={product.name}
                            className="grid grid-cols-[1fr_auto] gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0"
                          >
                            <div className="flex items-center gap-4">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-16 w-16 rounded-2xl object-cover"
                                />
                              )}

                              <div>
                                <p className="font-medium text-brand-blue">
                                  {product.name}
                                </p>

                                {product.note && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {product.note}
                                  </p>
                                )}
                              </div>
                            </div>

                            <p className="font-semibold text-brand-blue">
                              {product.quantity}
                            </p>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setQuoteItems(recommendedProducts);
                          setStep("summary");
                        }}
                        className="mt-6 w-full rounded-full bg-brand-blue px-6 py-3 text-white hover:bg-brand-beige hover:text-brand-blue transition-colors md:w-auto"
                      >
                        Continuar con esta recomendación
                      </button>
                    </div>
                  )}
                </>
              )}

              {step === "summary" &&
                (mode === "free" || (studioType && capacity)) && (
                  <div>
                    {mode === "guided" && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuoteItems([]);
                          setStep("start");
                        }}
                        className="text-sm text-brand-blue underline mb-6"
                      >
                        Editar recomendación
                      </button>
                    )}

                    <p className="text-sm uppercase tracking-[0.2em] text-brand-beige">
                      Resumen de cotización
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold text-brand-blue">
                      {mode === "guided" && studioType && capacity
                        ? `${studioType} para ${capacity} alumnas`
                        : "Cotización libre"}
                    </h2>

                    <p className="mt-3 text-gray-600">
                      {mode === "guided"
                        ? "Esta es tu recomendación inicial. Puedes editar cantidades, colores y precios."
                        : "Agrega productos libremente desde tu catálogo y ajusta cantidades, colores y precios."}
                    </p>
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                      <p className="font-semibold text-brand-blue">
                        Añadir producto
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Busca un producto de tu catálogo. Se añadirá con
                        cantidad inicial de 1.
                      </p>

                      <div className="relative mt-4">
                        <input
                          type="text"
                          value={productSearchQuery}
                          onFocus={() => setIsProductSearchOpen(true)}
                          onChange={(e) => {
                            setProductSearchQuery(e.target.value);
                            setIsProductSearchOpen(true);
                          }}
                          placeholder={
                            productsLoading
                              ? "Cargando productos..."
                              : "Buscar o seleccionar producto..."
                          }
                          disabled={productsLoading}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-brand-blue placeholder:text-gray-400 focus:border-brand-blue focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        {isProductSearchOpen && (
                          <div className="absolute left-0 right-0 top-full z-20 mt-3 max-h-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                                Productos
                              </p>

                              <button
                                type="button"
                                onClick={() => setIsProductSearchOpen(false)}
                                className="text-xs font-medium text-brand-blue underline"
                              >
                                Cerrar
                              </button>
                            </div>

                            {productSearchResults.length > 0 ? (
                              <ul className="divide-y divide-gray-100">
                                {productSearchResults.map((product) => (
                                  <li key={getProductIdentifier(product)}>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        if (!isProductInQuote(product)) {
                                          addProductToQuote(product);
                                        }
                                      }}
                                      disabled={isProductInQuote(product)}
                                      className={
                                        isProductInQuote(product)
                                          ? "flex w-full cursor-not-allowed items-center gap-4 bg-gray-50 p-3 text-left opacity-70"
                                          : "flex w-full items-center gap-4 p-3 text-left transition-colors hover:bg-gray-50"
                                      }
                                    >
                                      <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-16 w-16 flex-shrink-0 rounded-xl border border-gray-100 object-cover"
                                        loading="lazy"
                                      />

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-brand-blue">
                                          {product.name}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                          {formatCurrency(
                                            getProductPrice(product),
                                          )}
                                        </p>

                                        {product.category && (
                                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-400">
                                            {product.category}
                                          </p>
                                        )}
                                      </div>

                                      <span
                                        className={
                                          isProductInQuote(product)
                                            ? "rounded-full bg-gray-200 px-4 py-2 text-xs font-medium text-gray-500"
                                            : "rounded-full bg-brand-blue px-4 py-2 text-xs font-medium text-white"
                                        }
                                      >
                                        {isProductInQuote(product)
                                          ? "Añadido ✓"
                                          : "Añadir"}
                                      </span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="p-6 text-center text-sm text-gray-500">
                                No encontramos productos con esa búsqueda.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      {quoteItems.map((product) => (
                        <div
                          key={product.name}
                          className="grid gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_120px_140px] md:items-center"
                        >
                          <div className="flex gap-4">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-20 w-20 rounded-2xl object-cover"
                              />
                            )}

                            <div className="flex-1">
                              <p className="font-medium text-brand-blue">
                                {product.name}
                              </p>

                              <button
                                type="button"
                                onClick={() => removeQuoteItem(product.name)}
                                className="mt-1 text-xs font-medium text-red-500 underline"
                              >
                                Eliminar item
                              </button>

                              {product.note && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {product.note}
                                </p>
                              )}

                              <p className="mt-1 text-sm text-gray-500">
                                {formatCurrency(product.unitPrice)} c/u
                              </p>

                              <div className="mt-3">
                                <label className="block text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                                  Color
                                </label>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {product.availableColors.map((color) => {
                                    const isSelected =
                                      product.selectedColor === color;

                                    return (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={() =>
                                          updateQuoteItemColor(
                                            product.name,
                                            color,
                                          )
                                        }
                                        className={
                                          isSelected
                                            ? "flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-blue"
                                            : "flex h-8 w-8 items-center justify-center rounded-full border border-gray-300"
                                        }
                                        aria-label={`Seleccionar color ${color}`}
                                        title={color}
                                      >
                                        <span
                                          className="block h-6 w-6 rounded-full border border-gray-200"
                                          style={{ backgroundColor: color }}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex w-[120px] items-center justify-center gap-3 justify-self-start md:justify-self-center">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuoteItemQuantity(product.name, -1)
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
                              aria-label={`Quitar 1 ${product.name}`}
                            >
                              -
                            </button>

                            <p className="w-8 text-center font-semibold text-brand-blue tabular-nums">
                              {product.quantity}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuoteItemQuantity(product.name, 1)
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
                              aria-label={`Agregar 1 ${product.name}`}
                            >
                              +
                            </button>
                          </div>

                          <div className="w-[140px] justify-self-start text-left md:justify-self-end md:text-right">
                            {product.quantity >= 5 && (
                              <p className="text-xs font-medium text-green-600">
                                15% off aplicado
                              </p>
                            )}

                            {product.quantity >= 5 && (
                              <p className="text-xs text-gray-400 line-through">
                                {formatCurrency(getItemSubtotal(product))}
                              </p>
                            )}

                            <p className="font-semibold text-brand-blue tabular-nums">
                              {formatCurrency(getItemTotal(product))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-2xl bg-brand-blue px-6 py-5 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium">
                          Total estimado
                        </span>

                        <span className="text-2xl font-semibold">
                          {formatCurrency(quoteTotal)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs opacity-80">
                        El 15% de descuento se aplica individualmente por
                        producto cuando agregas 5 piezas o más del mismo item.
                      </p>
                    </div>
                    {quoteItems.length > 0 && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex w-full items-center justify-center rounded-full bg-brand-beige px-6 py-3 font-medium text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
                      >
                        Enviar cotización por WhatsApp
                      </a>
                    )}
                  </div>
                )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
