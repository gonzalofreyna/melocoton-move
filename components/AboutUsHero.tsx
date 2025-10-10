"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutUsHero() {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center py-24 px-6 bg-gray-50">
      {/* Frase */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-2xl md:text-4xl font-light text-brand-blue max-w-2xl leading-snug mb-10"
      >
        “El cuerpo logra lo que la mente cree.”
      </motion.h2>

      {/* Botón */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Link
          href="/aboutus"
          className="
            inline-flex items-center justify-center 
            px-8 py-3 rounded-full font-medium 
            text-sm md:text-base 
            text-brand-blue border border-brand-blue 
            bg-white shadow-sm
            hover:bg-brand-melon hover:shadow-md hover:scale-105 
            transition-all duration-300 ease-out
          "
        >
          Nosotros →
        </Link>
      </motion.div>
    </section>
  );
}
