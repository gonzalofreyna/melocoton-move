// context/CartContext.tsx
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
};

type CartContextType = {
  cart: CartItem[];
  cartCount: number;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (name: string) => void;
  increment: (name: string) => void;
  decrement: (name: string) => void;
  updateQuantity: (name: string, quantity: number) => void;
  clearCart: () => void; // 👈 nuevo
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // cargar del localStorage
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("cart") : null;
      if (raw) setCart(JSON.parse(raw));
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
      const existing = prev.find((p) => p.name === item.name);
      if (existing) {
        return prev.map((p) =>
          p.name === item.name ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (name: string) =>
    setCart((prev) => prev.filter((i) => i.name !== name));
  const increment = (name: string) =>
    setCart((prev) =>
      prev.map((i) =>
        i.name === name ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  const decrement = (name: string) =>
    setCart((prev) =>
      prev
        .map((i) => (i.name === name ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  const updateQuantity = (name: string, q: number) => {
    const qty = Math.max(0, Math.floor(Number(q) || 0));
    setCart((prev) =>
      qty === 0
        ? prev.filter((i) => i.name !== name)
        : prev.map((i) => (i.name === name ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => setCart([]); // 👈 limpia estado (y por el useEffect, también localStorage)

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
