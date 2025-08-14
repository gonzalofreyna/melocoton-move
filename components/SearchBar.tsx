// components/SearchBar.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router"; // Si usas App Router, cambia a: next/navigation

type Product = {
  name: string;
  slug: string;
  image: string;
  fullPrice: number;
  discountPrice?: number;
  colors: string[];
  category: string;
  featured: boolean;
  description: string;
};

const PRODUCTS_URL =
  process.env.NEXT_PUBLIC_PRODUCTS_URL ||
  "https://melocoton-move-assets.s3.us-east-1.amazonaws.com/products.json";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Cargar una vez los productos desde S3 y guardar solo los nombres
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(PRODUCTS_URL, { cache: "force-cache" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        const data: Product[] = await r.json();
        if (!isMounted) return;
        const onlyNames = data
          .map((p) => p?.name)
          .filter(
            (n): n is string => typeof n === "string" && n.trim().length > 0
          );
        setNames(onlyNames);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrar sugerencias al escribir
  useEffect(() => {
    const value = query.trim().toLowerCase();
    if (value.length > 1) {
      const filtered = names
        .filter((name) => name.toLowerCase().includes(value))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, names]);

  const handleSearch = (term: string) => {
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query) handleSearch(query);
        }}
        placeholder={loading ? "Cargando productos..." : "Buscar producto..."}
        className="w-full border px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        disabled={loading}
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-md">
          {suggestions.map((suggestion, idx) => (
            <li
              key={`${suggestion}-${idx}`}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSearch(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
