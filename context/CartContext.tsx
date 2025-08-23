import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type CartItem = {
  name: string;
  price: number;
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
  removeFromCart: (name: string) => void;
  increment: (name: string) => void;
  decrement: (name: string) => void;
  updateQuantity: (name: string, quantity: number) => void;
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

      // si el stock es 0, no agregamos
      if (maxStock === 0) return prev;

      const existing = prev.find((p) => p.name === item.name);
      if (existing) {
        const nextQty = clampToStock(existing.quantity + 1, existing.maxStock);
        if (nextQty === existing.quantity) {
          // ya en tope, no cambiamos
          return prev;
        }
        return prev.map((p) =>
          p.name === item.name ? { ...p, quantity: nextQty } : p
        );
      }

      // nuevo item: inicia en 1 (o 0 si maxStock=0, pero ya hicimos el early return)
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

  const removeFromCart = (name: string) =>
    setCart((prev) => prev.filter((i) => i.name !== name));

  const increment = (name: string) =>
    setCart((prev) =>
      prev.map((i) => {
        if (i.name !== name) return i;
        const nextQty = clampToStock(i.quantity + 1, i.maxStock);
        return nextQty === i.quantity ? i : { ...i, quantity: nextQty };
      })
    );

  const decrement = (name: string) =>
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.name !== name) return i;
          const nextQty = Math.max(0, i.quantity - 1);
          return { ...i, quantity: nextQty };
        })
        .filter((i) => i.quantity > 0)
    );

  const updateQuantity = (name: string, q: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.name !== name) return i;
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
