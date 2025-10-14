"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { fetchProducts } from "../lib/fetchProducts";
import type { Product } from "../lib/fetchProducts";

/** ===== Tipado del contexto ===== */
type ProductsContextType = {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextType>({
  products: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

/** ===== Provider principal ===== */
export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();

      // 🆕 Ahora cada producto incluye `shippingType` y `freeShipping` normalizados.
      setProducts(data);
    } catch (e: any) {
      console.error("Error cargando productos:", e);
      setError(e?.message || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedOnce.current) {
      loadedOnce.current = true;
      loadProducts();
    }
  }, []);

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        refresh: loadProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

/** ===== Hook de acceso ===== */
export function useProducts() {
  return useContext(ProductsContext);
}
