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
    "¡Hola! Quiero más información sobre Melocotón Move 💕",
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

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
        z-[70]
        flex justify-center
        px-4 pb-4
      "
    >
      <div
        className="
  w-full max-w-[430px]
  rounded-full
  bg-[#FFD6CC]/55
  backdrop-blur-lg
  border border-white/35
  shadow-[0_10px_30px_rgba(91,58,50,0.14)]
  flex justify-around items-center
  px-3 py-3
"
      >
        {/* Inicio */}
        <motion.button
          whileTap={tapAnimation}
          onClick={() => router.push("/")}
          className={`flex flex-col items-center justify-center text-[11px] font-medium transition-all duration-200 ${
            isActive("/")
              ? "text-[#5B3A32] scale-105 bg-white/35 rounded-full px-4 py-2 shadow-sm"
              : "text-[#8B6A62]/80 hover:text-[#5B3A32]"
          }`}
        >
          <HomeIcon className="h-6 w-6 mb-1" />
          Inicio
        </motion.button>

        {/* Productos */}
        <motion.button
          whileTap={tapAnimation}
          onClick={() => router.push("/products")}
          className={`flex flex-col items-center justify-center text-[11px] font-medium transition-all duration-200 ${
            isActive("/products")
              ? "text-[#5B3A32] scale-105 bg-white/35 rounded-full px-4 py-2 shadow-sm"
              : "text-[#8B6A62]/80 hover:text-[#5B3A32]"
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
          className="
            flex flex-col items-center justify-center
            text-[11px] font-medium
            text-[#8B6A62]/80 hover:text-[#5B3A32]
            transition-all duration-200
          "
        >
          <FaWhatsapp className="h-6 w-6 mb-1" />
          WhatsApp
        </motion.a>

        {/* Carrito */}
        <motion.button
          whileTap={tapAnimation}
          onClick={toggleCart}
          className={`relative flex flex-col items-center justify-center text-[11px] font-medium transition-all duration-200 ${
            isActive("/cart")
              ? "text-[#5B3A32] scale-105 bg-white/35 rounded-full px-4 py-2 shadow-sm"
              : "text-[#8B6A62]/80 hover:text-[#5B3A32]"
          }`}
        >
          <ShoppingCartIcon className="h-6 w-6 mb-1" />
          Carrito
          {cartCount > 0 && (
            <span
              className="
                absolute top-1 right-[18%]
                translate-x-1/2 -translate-y-1/2
                min-w-[1.15rem] px-1.5 py-0.5
                rounded-full
                bg-[#FF6F61] text-white
                text-[10px] font-bold text-center
                ring-2 ring-[#FFD6CC]
              "
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </motion.button>
      </div>
    </motion.nav>
  );
}
