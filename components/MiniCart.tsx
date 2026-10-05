"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import MiniCartItem from "./MiniCartItem";
import { createCheckout } from "../lib/checkoutClient";

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

  const shippingIsFree =
    !hasCustomShipping && (freeShippingPromo || qualifiesForFreeShipping);

  const effectiveShippingCost =
    hasCustomShipping || shippingIsFree ? 0 : (selectedRate?.total ?? 0);

  const shippingReady =
    hasCustomShipping ||
    (destinationComplete && (freeShippingPromo || selectedRate !== null));

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

    const validCode =
      process.env.NEXT_PUBLIC_COUPON_CODE?.trim().toUpperCase() || "";

    const percent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;

    if (!cleanCode) {
      setMsg("Introduce un código de descuento.");
      return;
    }

    // 1. Cupón porcentual normal
    if (validCode && cleanCode === validCode) {
      setFreeShippingPromo(false);
      setAppliedShippingPromoCode(null);

      const base = subtotal + (hasCustomShipping ? 0 : effectiveShippingCost);

      const discountAmt = (base * percent) / 100;

      setDiscount(discountAmt);
      setAppliedCoupon(validCode);

      setMsg(`Cupón aplicado: -${percent}%`);
      return;
    }

    // Guardamos el envío actual por si el código resulta inválido
    const previousRates = shippingRates;
    const previousSelectedRateId = selectedRateId;
    const previousShippingMsg = shippingMsg;
    const previousFreeShippingPromo = freeShippingPromo;
    const previousShippingPromoCode = appliedShippingPromoCode;

    // 2. Probar si es un código de envío gratis
    try {
      const result = await requestShippingQuote(cleanCode);

      if (result?.type === "free_shipping_promo") {
        setDiscount(0);
        setAppliedCoupon(null);

        setMsg("Envío gratis aplicado.");
        return;
      }

      // Seguridad adicional
      setShippingRates(previousRates);
      setSelectedRateId(previousSelectedRateId);
      setShippingMsg(previousShippingMsg);
      setFreeShippingPromo(previousFreeShippingPromo);
      setAppliedShippingPromoCode(previousShippingPromoCode);

      setMsg("Código no válido.");
    } catch (e: any) {
      console.error(e);

      // Restaurar el envío que ya había elegido el cliente
      setShippingRates(previousRates);
      setSelectedRateId(previousSelectedRateId);
      setShippingMsg(previousShippingMsg);
      setFreeShippingPromo(previousFreeShippingPromo);
      setAppliedShippingPromoCode(previousShippingPromoCode);

      setDiscount(0);
      setAppliedCoupon(null);

      setMsg(
        e?.message === "Código promocional no válido."
          ? "Código no válido."
          : e?.message || "No fue posible validar el código.",
      );
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

        selectedProvider: selectedRate?.provider,

        selectedServiceCode: selectedRate?.serviceCode,

        expectedShippingTotal: selectedRate?.total,

        shippingPromoCode: appliedShippingPromoCode ?? undefined,
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
        <div className="flex justify-between items-center px-4 py-4 sm:px-5 sm:py-5 border-b border-neutral-200/80 bg-white/80 backdrop-blur-sm">
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
                    shippingExcluded={!item.freeShipping}
                  />

                  {item.shippingType === "custom" && (
                    <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Envío especial · Este producto no participa en la
                        promoción de envío gratis y su envío se cotiza por
                        separado.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-neutral-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5 space-y-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">
              {!hasCustomShipping && (
                <div className="rounded-2xl border border-neutral-200 bg-[#FFFDF9] p-4 space-y-3 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold tracking-[-0.01em] text-brand-blue">
                      Calcula tu envío
                    </p>
                    <p className="text-xs text-gray-500">
                      Ingresa tu código postal para autocompletar tu dirección.
                    </p>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="Código postal"
                    value={postalCode}
                    onChange={(e) =>
                      setPostalCode(
                        e.target.value.replace(/\D/g, "").slice(0, 5),
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
                  />

                  {postalCodeLoading && (
                    <p className="text-xs text-gray-500">
                      Buscando dirección...
                    </p>
                  )}

                  {postalCodeMsg && (
                    <p className="text-xs text-red-600">{postalCodeMsg}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Estado"
                      value={areaLevel1}
                      onChange={(e) => setAreaLevel1(e.target.value)}
                      readOnly={!postalCodeMsg}
                      className={`rounded-xl border border-neutral-200 px-3.5 py-3 text-sm text-gray-700 ${
                        postalCodeMsg ? "bg-white" : "bg-neutral-50"
                      }`}
                    />

                    <input
                      type="text"
                      placeholder="Municipio / Alcaldía"
                      value={areaLevel2}
                      onChange={(e) => setAreaLevel2(e.target.value)}
                      readOnly={!postalCodeMsg}
                      className={`rounded-xl border border-neutral-200 px-3.5 py-3 text-sm text-gray-700 ${
                        postalCodeMsg ? "bg-white" : "bg-neutral-50"
                      }`}
                    />
                  </div>
                  {colonies.length > 0 ? (
                    <select
                      value={areaLevel3}
                      onChange={(e) => setAreaLevel3(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
                    >
                      <option value="">Selecciona tu colonia</option>

                      {colonies.map((colony) => (
                        <option key={colony} value={colony}>
                          {colony}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Colonia"
                      value={areaLevel3}
                      onChange={(e) => setAreaLevel3(e.target.value)}
                      disabled={postalCodeLoading}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 disabled:bg-neutral-50"
                    />
                  )}

                  {!freeShippingPromo && (
                    <button
                      type="button"
                      onClick={handleQuoteShipping}
                      disabled={
                        shippingLoading ||
                        postalCodeLoading ||
                        !destinationComplete
                      }
                      className="w-full rounded-xl border border-brand-blue px-3.5 py-3 text-sm font-medium text-brand-blue transition hover:bg-brand-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {postalCodeLoading
                        ? "Buscando dirección..."
                        : shippingLoading
                          ? "Cotizando..."
                          : "Cotizar envío"}
                    </button>
                  )}

                  {shippingIsFree && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Envío gratis
                      </p>

                      {freeShippingPromo && (
                        <p className="text-xs text-green-700 mt-1">
                          Código promocional aplicado.
                        </p>
                      )}
                    </div>
                  )}

                  {!shippingIsFree && shippingRates.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      <p className="text-xs font-medium text-gray-700">
                        Selecciona tu envío
                      </p>

                      {shippingRates.map((rate) => (
                        <label
                          key={rate.id}
                          className={`block rounded-2xl border p-3.5 cursor-pointer transition shadow-sm ${
                            selectedRateId === rate.id
                              ? "border-brand-blue bg-brand-blue/[0.04] shadow-[0_6px_20px_rgba(37,99,235,0.10)]"
                              : "border-neutral-200 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shipping-rate"
                              value={rate.id}
                              checked={selectedRateId === rate.id}
                              onChange={() => setSelectedRateId(rate.id)}
                            />

                            <div className="flex-1">
                              <div className="flex justify-between gap-3">
                                <span className="text-sm font-semibold text-gray-800">
                                  {rate.providerDisplayName}
                                </span>

                                <span className="text-sm font-semibold text-brand-blue">
                                  {MX.format(rate.total)}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 mt-1">
                                {rate.serviceName}
                                {rate.days
                                  ? ` · ${rate.days} día${
                                      rate.days === 1 ? "" : "s"
                                    }`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {shippingMsg && (
                    <p className="text-xs text-gray-600">{shippingMsg}</p>
                  )}
                </div>
              )}
              {/* Totales */}
              <div className="rounded-2xl bg-[#FCFBF8] border border-neutral-200 px-4 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <span>{MX.format(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700">Envío</span>
                  <span>
                    {hasCustomShipping
                      ? "A cotizar"
                      : shippingIsFree
                        ? "Gratis"
                        : selectedRate
                          ? MX.format(effectiveShippingCost)
                          : "Por calcular"}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Descuento ({appliedCoupon})</span>
                    <span>-{MX.format(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-neutral-200 pt-3 mt-3 text-base font-semibold text-brand-blue">
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
                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="w-full sm:w-auto bg-brand-blue text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-brand-beige hover:text-brand-blue transition"
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

                {hasCustomShipping ? (
                  <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-xs font-medium text-amber-900">
                      Este pedido contiene envío especial
                    </p>

                    <p className="text-xs mt-1 text-amber-800 leading-relaxed">
                      Los productos con envío especial no participan en
                      promociones de envío gratis. Su costo de envío se cotiza
                      por separado.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs mt-2 text-gray-700">
                    {freeShippingPromo
                      ? "Código de envío gratis aplicado."
                      : shippingIsFree
                        ? "Envío gratis."
                        : selectedRate
                          ? `${selectedRate.providerDisplayName} · ${selectedRate.serviceName}`
                          : "Cotiza el envío para continuar."}
                  </p>
                )}
              </div>

              {/* Botón */}
              <button
                onClick={handleCheckout}
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
