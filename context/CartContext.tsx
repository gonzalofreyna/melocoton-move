"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { usePathname } from "next/navigation"; // 👈 agregado

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  freeShipping?: boolean;
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
  allItemsFreeShipping: boolean;
  hasAnyNonFreeShipping: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  subtotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function clampToStock(qty: number, maxStock?: number) {
  const q = Math.max(0, Math.floor(Number(qty) || 0));
  if (typeof maxStock === "number" && Number.isFinite(maxStock)) {
    return Math.min(q, Math.max(0, Math.floor(maxStock)));
  }
  return q;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); // 👈 aquí detectamos la ruta actual

  // ⛳ Cargar carrito desde localStorage
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

  // 💾 Guardar carrito en localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(cart));
      }
    } catch {}
  }, [cart]);

  // 🚀 Limpia automáticamente el carrito al entrar a /success
  useEffect(() => {
    if (pathname === "/success") {
      setCart([]);
      localStorage.removeItem("cart");
      setIsOpen(false);
    }
  }, [pathname]);

  // 📊 Derivados
  const cartCount = cart.reduce((t, i) => t + i.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ⚙️ Acciones
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((p) => !p), []);

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
        if (nextQty === existing.quantity) return prev;
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

    setIsOpen(true); // abrir MiniCart al agregar
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

  // 🚚 Selectores de envío
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
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        subtotal,
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
