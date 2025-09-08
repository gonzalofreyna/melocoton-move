// pages/cart.tsx
import { useState } from "react";
import { useCart } from "../context/CartContext";
import FreeShippingBadge from "../components/FreeShippingBadge";

export default function CartPage() {
  const {
    cart,
    cartCount,
    removeFromCart,
    increment,
    decrement,
    updateQuantity,
    allItemsFreeShipping,
    hasAnyNonFreeShipping,
  } = useCart();

  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Solo para UI (no afecta el cargo real en Stripe)
  const ENV_UI_PERCENT = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;
  const ENV_UI_CODE = (process.env.NEXT_PUBLIC_COUPON_CODE || "").toUpperCase();

  const visualDiscount = applied ? subtotal * (ENV_UI_PERCENT / 100) : 0;
  const visualTotal = Math.max(0, subtotal - visualDiscount);

  const applyCode = () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setMsg("Ingresa un código.");
      return;
    }
    if (normalized === ENV_UI_CODE && ENV_UI_PERCENT > 0) {
      setApplied(true);
      setMsg("Código aplicado ✔︎");
    } else {
      setApplied(false);
      setMsg("Código inválido.");
    }
  };

  const removeCode = () => {
    setApplied(false);
    setMsg(null);
    setCode("");
  };

  const handleCheckout = async () => {
    try {
      setMsg(null);
      setCheckingOut(true);

      // Validación: todo ítem debe tener slug
      const invalid = cart.find((i) => !i.slug || typeof i.slug !== "string");
      if (invalid) {
        setMsg(
          "Un producto de tu carrito es de una versión anterior. Elimínalo y vuelve a agregarlo."
        );
        return;
      }

      // Solo lo necesario para el servidor
      const items = cart.map((i) => ({
        slug: i.slug,
        quantity: i.quantity,
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          // Mandamos el código de texto; el backend decide si aplica (COUPON_CODE + STRIPE_COUPON_ID)
          couponCode: applied ? code.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "No se pudo iniciar el checkout");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg("No se recibió URL de Stripe.");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Error en checkout.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <main className="flex flex-col items-center px-6 py-16 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-brand-blue mb-8">
        Tu Carrito ({cartCount} {cartCount === 1 ? "producto" : "productos"})
      </h1>

      {cart.length > 0 && (
        <div className="w-full max-w-4xl mb-4">
          {hasAnyNonFreeShipping ? (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 text-sm">
              Este pedido <strong>no aplica a envío gratis</strong> porque uno o
              más productos no lo incluyen.
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 p-3 text-sm">
              Envío gratis incluido 🚚✨
            </div>
          )}
        </div>
      )}

      {cart.length === 0 ? (
        <p className="text-gray-600">Tu carrito está vacío.</p>
      ) : (
        <div className="w-full max-w-4xl space-y-4">
          {cart.map((item) => {
            const max = item.maxStock;
            const atLimit =
              typeof max === "number" && Number.isFinite(max)
                ? item.quantity >= max
                : false;

            return (
              <div
                key={item.slug}
                className="flex items-center bg-white shadow-md rounded-xl p-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-20 w-20 object-contain rounded-lg"
                />
                <div className="flex-1 ml-4 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-brand-blue">
                      {item.name}
                    </h3>

                    <FreeShippingBadge free={!!item.freeShipping} />
                  </div>

                  <p className="text-gray-700 text-sm">
                    Precio unitario: ${item.price.toFixed(2)} MXN
                  </p>

                  {/* Controles de cantidad */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <button
                      aria-label={`Disminuir cantidad de ${item.name}`}
                      onClick={() => decrement(item.slug)}
                      className="px-2 py-1 rounded-lg border md:hover:bg-gray-100"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={typeof max === "number" ? max : undefined}
                      value={item.quantity}
                      onChange={(e) => {
                        const v = Math.max(
                          1,
                          Math.floor(Number(e.target.value) || 1)
                        );
                        const clamped =
                          typeof max === "number" && Number.isFinite(max)
                            ? Math.min(v, max)
                            : v;
                        updateQuantity(item.slug, clamped);
                      }}
                      className="w-16 text-center border rounded-lg py-1"
                    />

                    <button
                      aria-label={`Aumentar cantidad de ${item.name}`}
                      onClick={() => increment(item.slug)}
                      disabled={atLimit}
                      className={`px-2 py-1 rounded-lg border md:hover:bg-gray-100 ${
                        atLimit ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      title={atLimit ? "Alcanzaste el stock disponible" : ""}
                    >
                      +
                    </button>
                  </div>

                  {/* mensaje de stock */}
                  {typeof max === "number" && Number.isFinite(max) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stock disponible: {max}{" "}
                      {atLimit && (
                        <span className="text-red-600 font-medium">
                          (stock máximo)
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-brand-beige font-bold mt-2">
                    Subtotal: ${(item.price * item.quantity).toFixed(2)} MXN
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.slug)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg md:hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            );
          })}

          {/* Código de descuento (UI; el backend decide el real) */}
          <div className="bg-white shadow-md rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Código de descuento
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ingresa tu código"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-brand-blue"
                disabled={applied}
              />
              {msg && (
                <p
                  className={`text-sm mt-1 ${
                    applied ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {msg}
                </p>
              )}
            </div>
            {applied ? (
              <button
                onClick={removeCode}
                className="whitespace-nowrap bg-gray-200 text-gray-800 px-4 py-2 rounded-lg md:hover:bg-gray-300 transition-colors"
              >
                Quitar código
              </button>
            ) : (
              <button
                onClick={applyCode}
                className="whitespace-nowrap bg-brand-blue text-white px-4 py-2 rounded-lg md:hover:bg-brand-beige md:hover:text-brand-blue transition-colors"
              >
                Aplicar
              </button>
            )}
          </div>

          {/* Resumen final (Stripe mostrará el total real) */}
          <div className="bg-white shadow-md rounded-xl p-6 text-right mt-4">
            <p className="text-sm text-gray-600">
              Subtotal: ${subtotal.toFixed(2)} MXN
            </p>

            {applied && (
              <p className="text-sm text-green-700">
                Descuento (estimado {ENV_UI_PERCENT}%): −
                {visualDiscount.toFixed(2)} MXN
              </p>
            )}

            <p className="text-sm mt-2">
              {hasAnyNonFreeShipping ? (
                <span className="text-yellow-800">
                  Este pedido <strong>no aplica a envío gratis</strong>.
                </span>
              ) : (
                <span className="text-green-700">
                  Envío gratis incluido 🚚✨
                </span>
              )}
            </p>

            <p className="text-lg font-bold text-brand-blue mt-2">
              Total estimado: ${visualTotal.toFixed(2)} MXN
            </p>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="mt-4 bg-brand-blue text-white py-3 px-6 rounded-xl font-semibold md:hover:bg-brand-beige md:hover:text-brand-blue transition-colors disabled:opacity-50"
            >
              {checkingOut ? "Redirigiendo..." : "Proceder al pago"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
