// context/CartContext.tsx
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type CartItem = {
  slug: string; // 👈 clave del producto para el checkout seguro
  name: string;
  price: number; // usado solo para mostrar en UI (no confiamos en él en el server)
  image: string;
  quantity: number;
  freeShipping?: boolean;
  /** stock máximo permitido para este ítem */
  maxStock?: number;
};

type CartContextType = {
  cart: CartItem[];
  cartCount: number;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (slug: string) => void;
  increment: (slug: string) => void;
  decrement: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  /** true solo si TODOS los productos del carrito tienen freeShipping:true */
  allItemsFreeShipping: boolean;
  /** true si existe al menos un producto con freeShipping:false (o undefined) */
  hasAnyNonFreeShipping: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function clampToStock(qty: number, maxStock?: number) {
  const q = Math.max(0, Math.floor(Number(qty) || 0));
  if (typeof maxStock === "number" && Number.isFinite(maxStock)) {
    return Math.min(q, Math.max(0, Math.floor(maxStock)));
  }
  return q; // sin límite si no hay stock definido
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // cargar del localStorage
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("cart") : null;
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        setCart(
          parsed.map((i) => {
            const maxStock =
              typeof i.maxStock === "number" && Number.isFinite(i.maxStock)
                ? Math.max(0, Math.floor(i.maxStock))
                : undefined;
            return {
              ...i,
              freeShipping: i.freeShipping === true,
              maxStock,
              quantity: clampToStock(i.quantity, maxStock),
            };
          })
        );
      }
    } catch {}
  }, []);

  // guardar en localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(cart));
      }
    } catch {}
  }, [cart]);

  const cartCount = cart.reduce((t, i) => t + i.quantity, 0);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const maxStock =
        typeof item.maxStock === "number" && Number.isFinite(item.maxStock)
          ? Math.max(0, Math.floor(item.maxStock))
          : undefined;

      if (maxStock === 0) return prev;

      const existing = prev.find((p) => p.slug === item.slug);
      if (existing) {
        const nextQty = clampToStock(existing.quantity + 1, existing.maxStock);
        if (nextQty === existing.quantity) {
          return prev;
        }
        return prev.map((p) =>
          p.slug === item.slug ? { ...p, quantity: nextQty } : p
        );
      }

      return [
        ...prev,
        {
          ...item,
          freeShipping: item.freeShipping === true,
          maxStock,
          quantity: clampToStock(1, maxStock),
        },
      ];
    });
  };

  const removeFromCart = (slug: string) =>
    setCart((prev) => prev.filter((i) => i.slug !== slug));

  const increment = (slug: string) =>
    setCart((prev) =>
      prev.map((i) => {
        if (i.slug !== slug) return i;
        const nextQty = clampToStock(i.quantity + 1, i.maxStock);
        return nextQty === i.quantity ? i : { ...i, quantity: nextQty };
      })
    );

  const decrement = (slug: string) =>
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.slug !== slug) return i;
          const nextQty = Math.max(0, i.quantity - 1);
          return { ...i, quantity: nextQty };
        })
        .filter((i) => i.quantity > 0)
    );

  const updateQuantity = (slug: string, q: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.slug !== slug) return i;
          const nextQty = clampToStock(q, i.maxStock);
          return { ...i, quantity: nextQty };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  // Selectors envío
  const allItemsFreeShipping =
    cart.length > 0 && cart.every((i) => i.freeShipping === true);

  const hasAnyNonFreeShipping =
    cart.length > 0 && cart.some((i) => i.freeShipping !== true);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        increment,
        decrement,
        updateQuantity,
        clearCart,
        allItemsFreeShipping,
        hasAnyNonFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
