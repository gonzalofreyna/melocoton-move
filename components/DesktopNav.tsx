// components/DesktopNav.tsx
import Link from "next/link";
import { useMemo } from "react";
import { useAppConfig } from "../context/ConfigContext";

export default function DesktopNav() {
  const { config, loading } = useAppConfig();

  // 🔹 Mapeo de items del backend a href finales (fuera del return, sin condicionales)
  const navToHref = (item: any): string => {
    const kind = item?.kind || "link";
    if (kind === "category" && item?.category)
      return `/products?category=${encodeURIComponent(item.category)}`;
    if (kind === "onSale") return "/products?onSale=1";
    if (kind === "popular") return "/products?popular=1";
    if (kind === "freeShipping") return "/products?freeShipping=1";
    return item?.href || "/";
  };

  // 🔹 useMemo siempre se ejecuta, aunque config sea undefined
  const categories = useMemo(() => {
    const nav = config?.navigation?.primary || [];
    return nav
      .filter((i: any) => i.enabled !== false)
      .map((i: any) => ({
        label: i.label,
        href: navToHref(i),
      }));
  }, [config]);

  // 🔹 Ya es seguro cortar el render aquí
  if (loading || !categories.length) return null;

  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm lg:text-base font-medium text-brand-blue">
      {categories.map((cat) => (
        <Link
          key={cat.href}
          href={cat.href}
          className="relative group transition-colors hover:text-brand-beige"
        >
          {cat.label}
          <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-brand-beige transition-all duration-300 group-hover:w-full" />
        </Link>
      ))}
    </nav>
  );
}
