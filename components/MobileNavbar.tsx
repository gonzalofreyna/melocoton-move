"use client";

import { useRouter } from "next/router";
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { FaWhatsapp } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

export default function MobileNavbar() {
  const router = useRouter();
  const { cartCount, toggleCart } = useCart();

  const isActive = (path: string) => router.pathname === path;

  const whatsappNumber = "5213310125501";
  const message = encodeURIComponent(
    "¡Hola! Quiero más información sobre Melocotón Move 💕"
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  // ✨ Animación tap “rebote + flash beige”
  const tapAnimation = {
    scale: 0.9,
    transition: { duration: 0.15, ease: "easeOut" as const },
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="
        sm:hidden
        fixed bottom-0 left-0 right-0
        bg-white/80 backdrop-blur-md
        border-t border-gray-200
        shadow-[0_-4px_12px_rgba(0,0,0,0.06)]
        flex justify-around items-center
        py-3 z-[70]
      "
    >
      {/* Inicio */}
      <motion.button
        whileTap={tapAnimation}
        onClick={() => router.push("/")}
        className={`flex flex-col items-center text-xs font-medium transition-all duration-200 ${
          isActive("/")
            ? "text-brand-blue scale-110"
            : "text-gray-400 hover:text-brand-blue"
        }`}
      >
        <HomeIcon className="h-6 w-6 mb-1" />
        Inicio
      </motion.button>

      {/* Productos */}
      <motion.button
        whileTap={tapAnimation}
        onClick={() => router.push("/products")}
        className={`flex flex-col items-center text-xs font-medium transition-all duration-200 ${
          isActive("/products")
            ? "text-brand-blue scale-110"
            : "text-gray-400 hover:text-brand-blue"
        }`}
      >
        <ShoppingBagIcon className="h-6 w-6 mb-1" />
        Productos
      </motion.button>

      {/* WhatsApp */}
      <motion.a
        whileTap={tapAnimation}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-xs font-medium text-gray-400 hover:text-brand-blue transition-all duration-200"
      >
        <FaWhatsapp className="h-6 w-6 mb-1" />
        WhatsApp
      </motion.a>

      {/* Carrito */}
      <motion.button
        whileTap={tapAnimation}
        onClick={toggleCart}
        className={`relative flex flex-col items-center text-xs font-medium transition-all duration-200 ${
          isActive("/cart")
            ? "text-brand-blue scale-110"
            : "text-gray-400 hover:text-brand-blue"
        }`}
      >
        <ShoppingCartIcon className="h-6 w-6 mb-1" />
        Carrito
        {cartCount > 0 && (
          <span
            className="
              absolute top-0 right-[22%]
              translate-x-1/2 -translate-y-1/2
              min-w-[1.2rem] px-1.5 py-0.5
              rounded-full bg-brand-beige text-brand-blue
              text-[10px] font-bold text-center
              ring-1 ring-black/5
            "
          >
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </motion.button>
    </motion.nav>
  );
}
