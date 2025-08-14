// pages/cart.tsx
import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const {
    cart,
    cartCount,
    removeFromCart,
    increment,
    decrement,
    updateQuantity,
  } = useCart();

  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // Subtotales y descuento (desde .env)
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const envPercent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;
  const envCode = (process.env.NEXT_PUBLIC_COUPON_CODE || "").toUpperCase();

  const discount = applied ? subtotal * (envPercent / 100) : 0;
  const total = Math.max(0, subtotal - discount);

  // Aplicar / quitar código
  const applyCode = () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setMsg("Ingresa un código.");
      return;
    }
    if (normalized === envCode && envPercent > 0) {
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

  // Checkout con Stripe (redirige a la URL que devuelve tu API)
  const handleCheckout = async () => {
    try {
      setMsg(null);
      setCheckingOut(true);

      // Prepara items como los espera la API
      const items = cart.map((i) => ({
        name: i.name,
        image: i.image, // si es ruta relativa, el backend la convierte a absoluta
        price: i.price, // MXN (el backend lo pasa a centavos)
        quantity: i.quantity,
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          discountPercent: applied ? envPercent : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "No se pudo iniciar el checkout");
      }

      if (data.url) {
        window.location.href = data.url; // Redirige a Stripe Checkout
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

      {cart.length === 0 ? (
        <p className="text-gray-600">Tu carrito está vacío.</p>
      ) : (
        <div className="w-full max-w-4xl space-y-4">
          {cart.map((item) => (
            <div
              key={item.name}
              className="flex items-center bg-white shadow-md rounded-xl p-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-20 w-20 object-contain rounded-lg"
              />
              <div className="flex-1 ml-4 text-left">
                <h3 className="text-lg font-semibold text-brand-blue">
                  {item.name}
                </h3>
                <p className="text-gray-700 text-sm">
                  Precio unitario: ${item.price.toFixed(2)} MXN
                </p>

                {/* Controles de cantidad */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    aria-label={`Disminuir cantidad de ${item.name}`}
                    onClick={() => decrement(item.name)}
                    className="px-2 py-1 rounded-lg border hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.name, Number(e.target.value) || 1)
                    }
                    className="w-16 text-center border rounded-lg py-1"
                  />
                  <button
                    aria-label={`Aumentar cantidad de ${item.name}`}
                    onClick={() => increment(item.name)}
                    className="px-2 py-1 rounded-lg border hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <p className="text-brand-beige font-bold mt-2">
                  Subtotal: ${(item.price * item.quantity).toFixed(2)} MXN
                </p>
              </div>

              <button
                onClick={() => removeFromCart(item.name)}
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          ))}

          {/* Código de descuento */}
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
                className="whitespace-nowrap bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Quitar código
              </button>
            ) : (
              <button
                onClick={applyCode}
                className="whitespace-nowrap bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-beige hover:text-brand-blue transition-colors"
              >
                Aplicar
              </button>
            )}
          </div>

          {/* Resumen final */}
          <div className="bg-white shadow-md rounded-xl p-6 text-right mt-4">
            <p className="text-sm text-gray-600">
              Subtotal: ${subtotal.toFixed(2)} MXN
            </p>
            {applied && (
              <p className="text-sm text-green-700">
                Descuento ({envPercent}%): −${discount.toFixed(2)} MXN
              </p>
            )}
            <p className="text-lg font-bold text-brand-blue mt-2">
              Total: ${total.toFixed(2)} MXN
            </p>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="mt-4 bg-brand-blue text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-beige hover:text-brand-blue transition-colors disabled:opacity-50"
            >
              {checkingOut ? "Redirigiendo..." : "Proceder al pago"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
