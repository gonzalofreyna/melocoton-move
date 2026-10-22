"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import MiniCartItem from "./MiniCartItem";
import { createCheckout } from "../lib/checkoutClient";
import { reportGa4BeginCheckout } from "../lib/ga4Ecommerce";

const MX = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

type ShippingRate = {
  id: string;
  provider: string;
  providerDisplayName: string;
  serviceName: string;
  serviceCode: string;
  total: number;
  amount: number | null;
  serviceFee: number | null;
  days: number | null;
  currency: string;
  pickup: boolean;
  officeDelivery: boolean;
  officeDeliveryOnly: boolean;
};

const SHIPPING_API_URL = (
  process.env.NEXT_PUBLIC_SHIPPING_API_URL || ""
).replace(/\/$/, "");

export default function MiniCart() {
  const {
    cart,
    subtotal,
    isOpen,
    closeCart,
    qualifiesForFreeShipping,
    hasCustomShipping,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const [postalCode, setPostalCode] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [freeShippingPromo, setFreeShippingPromo] = useState(false);

  const [areaLevel1, setAreaLevel1] = useState("");
  const [areaLevel2, setAreaLevel2] = useState("");
  const [areaLevel3, setAreaLevel3] = useState("");

  const [postalCodeLoading, setPostalCodeLoading] = useState(false);
  const [postalCodeMsg, setPostalCodeMsg] = useState<string | null>(null);
  const [colonies, setColonies] = useState<string[]>([]);

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  const [appliedShippingPromoCode, setAppliedShippingPromoCode] = useState<
    string | null
  >(null);

  const [shippingMsg, setShippingMsg] = useState<string | null>(null);

  const selectedRate =
    shippingRates.find((rate) => rate.id === selectedRateId) || null;

  const destinationComplete =
    /^\d{5}$/.test(postalCode.trim()) &&
    areaLevel1.trim() !== "" &&
    areaLevel2.trim() !== "" &&
    areaLevel3.trim() !== "";

  const shippingIsFree = true;
  const effectiveShippingCost = 0;
  const shippingReady = true;

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanPostalCode = postalCode.trim();

    if (cleanPostalCode.length !== 5) {
      setAreaLevel1("");
      setAreaLevel2("");
      setAreaLevel3("");
      setColonies([]);
      setPostalCodeMsg(null);
      return;
    }

    if (!/^\d{5}$/.test(cleanPostalCode)) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setPostalCodeLoading(true);
        setPostalCodeMsg(null);

        const res = await fetch(
          `${SHIPPING_API_URL}/api/shipping/postal-code/${cleanPostalCode}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          throw new Error(
            data?.message || data?.error || "No encontramos ese código postal.",
          );
        }

        const nextColonies = Array.isArray(data.colonies) ? data.colonies : [];

        setAreaLevel1(data.areaLevel1 || "");
        setAreaLevel2(data.areaLevel2 || "");
        setColonies(nextColonies);

        if (nextColonies.length === 1) {
          setAreaLevel3(nextColonies[0]);
        } else {
          setAreaLevel3("");
        }
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error(error);

        setAreaLevel1("");
        setAreaLevel2("");
        setAreaLevel3("");
        setColonies([]);

        setPostalCodeMsg(
          error?.message || "No fue posible consultar el código postal.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setPostalCodeLoading(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [postalCode]);

  // 🔁 Recalcular descuento si cambia el subtotal o el cupón aplicado
  // 🔁 Recalcular descuento si cambia el subtotal, el envío o el cupón aplicado
  useEffect(() => {
    if (!appliedCoupon) return;

    const validCode =
      process.env.NEXT_PUBLIC_COUPON_CODE?.trim().toUpperCase() || "";

    const percent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;

    if (appliedCoupon === validCode) {
      const base = subtotal + (hasCustomShipping ? 0 : effectiveShippingCost);

      const newDiscount = (base * percent) / 100;

      setDiscount(newDiscount);
    }
  }, [subtotal, effectiveShippingCost, hasCustomShipping, appliedCoupon]);

  // 🧹 Limpiar cupón si el carrito queda vacío
  useEffect(() => {
    if (cart.length === 0) {
      setPostalCode("");
      setAreaLevel1("");
      setAreaLevel2("");
      setAreaLevel3("");

      setShippingRates([]);
      setSelectedRateId(null);
      setFreeShippingPromo(false);
      setAppliedShippingPromoCode(null);
      setShippingMsg(null);
      setAppliedCoupon(null);
      setDiscount(0);
      setMsg(null);
      setCoupon("");
    }
  }, [cart]);

  const cartShippingKey = cart
    .map((item) => `${item.slug}:${item.quantity}`)
    .join("|");

  useEffect(() => {
    setShippingRates([]);
    setSelectedRateId(null);
    setFreeShippingPromo(false);
    setAppliedShippingPromoCode(null);
    setShippingMsg(null);
    setMsg(null);
  }, [cartShippingKey, postalCode, areaLevel1, areaLevel2, areaLevel3]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  // Focus trap básico
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea",
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  const requestShippingQuote = async (promoCode?: string) => {
    if (hasCustomShipping) {
      setShippingMsg(
        "Este pedido contiene productos con envío especial que se cotizan por separado.",
      );

      return null;
    }

    if (!SHIPPING_API_URL) {
      throw new Error("Falta NEXT_PUBLIC_SHIPPING_API_URL.");
    }

    if (!/^\d{5}$/.test(postalCode.trim())) {
      throw new Error("Introduce un código postal válido de 5 dígitos.");
    }

    if (!areaLevel1.trim() || !areaLevel2.trim() || !areaLevel3.trim()) {
      throw new Error("Completa estado, municipio/alcaldía y colonia.");
    }

    const items = cart.map((item) => ({
      slug: item.slug,
      quantity: item.quantity,
    }));

    setShippingLoading(true);
    setShippingMsg(null);

    try {
      const res = await fetch(`${SHIPPING_API_URL}/api/shipping/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postalCode: postalCode.trim(),
          areaLevel1: areaLevel1.trim(),
          areaLevel2: areaLevel2.trim(),
          areaLevel3: areaLevel3.trim(),
          promoCode: promoCode?.trim() || undefined,
          items,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            data?.message ||
            "No fue posible cotizar el envío.",
        );
      }

      if (data.type === "custom") {
        setShippingRates([]);
        setSelectedRateId(null);

        setShippingMsg(data.message || "Este pedido contiene envío especial.");

        return data;
      }

      if (data.type === "free_shipping_promo") {
        setShippingRates([]);
        setSelectedRateId(null);

        setFreeShippingPromo(true);

        setAppliedShippingPromoCode(promoCode?.trim().toUpperCase() || null);

        setShippingMsg("Código de envío gratis aplicado.");

        return data;
      }

      const rates: ShippingRate[] = Array.isArray(data.rates) ? data.rates : [];

      if (rates.length === 0) {
        throw new Error("No encontramos opciones de envío para este destino.");
      }

      setFreeShippingPromo(false);
      setAppliedShippingPromoCode(null);
      setShippingRates(rates);

      /*
       * Si ya aplica envío gratis por la promoción normal,
       * el cliente no necesita elegir la paquetería.
       * El servidor elegirá después la opción más económica.
       */
      if (qualifiesForFreeShipping) {
        setSelectedRateId(rates[0].id);

        setShippingMsg("Envío gratis disponible.");
      } else {
        setSelectedRateId(null);

        setShippingMsg("Selecciona una opción de envío.");
      }

      return data;
    } finally {
      setShippingLoading(false);
    }
  };

  const handleQuoteShipping = async () => {
    try {
      await requestShippingQuote();
    } catch (e: any) {
      console.error(e);

      setShippingMsg(e?.message || "No fue posible cotizar el envío.");
    }
  };

  const handleApplyCoupon = async () => {
    const cleanCode = coupon.trim().toUpperCase();
    const validCode = process.env.NEXT_PUBLIC_COUPON_CODE?.trim().toUpperCase() || "";
    const percent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;
    if (validCode && cleanCode === validCode) {
      setDiscount((subtotal * percent) / 100);
      setAppliedCoupon(validCode);
      setMsg(`Cupón aplicado: -${percent}%`);
    } else {
      setMsg("Código no válido.");
    }
  };

  // Analytics observes the enabled button click; checkout logic is unchanged.
  const trackCheckoutClick = () => {
    try {
      reportGa4BeginCheckout(
        cart.map((item) => ({
          item_id: item.sku?.trim() || item.slug,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
        appliedCoupon ?? undefined,
      );
    } catch (analyticsError) {
      console.warn("GA4 begin_checkout no disponible", analyticsError);
    }
  };

  const handleCheckout = async () => {
    try {
      if (!shippingReady) {
        setMsg(
          "Cotiza tu envío y selecciona una opción antes de finalizar la compra.",
        );

        return;
      }
      setMsg(null);
      setLoading(true);

      const invalid = cart.find((i) => !i.slug || typeof i.slug !== "string");
      if (invalid) {
        setMsg(
          "Un producto de tu carrito pertenece a una versión anterior. Elimínalo y vuelve a agregarlo.",
        );
        setLoading(false);
        return;
      }

      const items = cart.map((i) => ({
        slug: i.slug,
        quantity: i.quantity,
      }));

      // ✅ Llamada al endpoint AWS (usa createCheckout de src/lib/checkoutClient)
      const data = await createCheckout(items, appliedCoupon ?? undefined, {
        postalCode: postalCode.trim(),
        areaLevel1: areaLevel1.trim(),
        areaLevel2: areaLevel2.trim(),
        areaLevel3: areaLevel3.trim(),

        // Stripe collects delivery address; shipping quotation not required.
      });

      if (!data?.ok || !data?.url) {
        throw new Error(data?.message || "No se recibió URL de Stripe.");
      }

      window.location.href = data.url; // 🚀 redirige al checkout de Stripe
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Error en checkout.");
    } finally {
      setLoading(false);
    }
  };

  const totalBeforeDiscount =
    subtotal + (hasCustomShipping ? 0 : effectiveShippingCost);
  const total = totalBeforeDiscount - discount;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-[1100] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={`fixed top-0 right-0 h-[100dvh] w-full sm:w-[420px] bg-[#FFFEFC] shadow-[0_10px_40px_rgba(15,23,42,0.10)] transform transition-transform duration-300 z-[1110] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4 sm:px-5 sm:py-5 border-b border-brand-line bg-white/80 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-brand-blue">
            Tu carrito
          </h2>
          <button
            onClick={closeCart}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full text-gray-500 hover:text-brand-blue hover:bg-gray-100 transition text-xl leading-none"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-5 sm:py-5 space-y-3">
            {cart.length === 0 ? (
              <p className="text-gray-600 text-center mt-12 text-base">
                Tu carrito está vacío 🛍️
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.slug}>
                  <MiniCartItem
                    slug={item.slug}
                    name={item.name}
                    image={item.image}
                    price={item.price}
                    quantity={item.quantity}
                    shippingExcluded={false}
                  />

                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-brand-line bg-white px-4 py-4 sm:px-5 sm:py-5 space-y-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">
              <div className="rounded-2xl border border-brand-line bg-brand-cream p-4">
                <p className="text-sm font-semibold text-brand-blue">🚚 Envío gratis en todos los productos</p>
                <p className="text-xs text-gray-600 mt-1">Ingresa tu dirección de entrega en el pago seguro de Stripe.</p>
              </div>
              {/* Totales */}
              <div className="rounded-2xl bg-brand-cream border border-brand-line px-4 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <span>{MX.format(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700">Envío</span>
                  <span>
                    Gratis
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Descuento ({appliedCoupon})</span>
                    <span>-{MX.format(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-brand-line pt-3 mt-3 text-base font-semibold text-brand-blue">
                  <span>Total</span>
                  <span>{MX.format(total)}</span>
                </div>
              </div>

              {/* Cupón */}
              <div className="mt-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Cupón"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 rounded-xl border border-brand-line bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="mm-button w-full sm:w-auto"
                  >
                    Aplicar
                  </button>
                </div>

                {msg && (
                  <p
                    className={`text-sm mt-1 ${
                      msg.includes("válido") ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {msg}
                  </p>
                )}

                <p className="text-xs mt-2 text-gray-700">Envío gratis también en productos voluminosos.</p>
              </div>

              {/* Botón */}
              <button
                onClick={() => { trackCheckoutClick(); void handleCheckout(); }}
                disabled={loading || shippingLoading || !shippingReady}
                className={`w-full py-3.5 mt-2 rounded-2xl font-semibold text-[15px] shadow-sm transition ${
                  loading || shippingLoading || !shippingReady
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-brand-blue text-white hover:bg-brand-beige hover:text-brand-blue"
                }`}
              >
                {loading ? "Procesando..." : "Finalizar compra"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
