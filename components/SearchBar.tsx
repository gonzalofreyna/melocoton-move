import { useState } from "react";
import { useRouter } from "next/router";
import { products } from "../data/products";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 1) {
      const filtered = products
        .map((p) => p.name)
        .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // máximo 5 sugerencias

      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = (term: string) => {
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query) handleSearch(query);
        }}
        placeholder="Buscar producto..."
        className="w-full border px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-md">
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
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
