"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutUsHero() {
  return (
    <section className="mm-section flex flex-col items-center justify-center bg-brand-sand px-6 text-center">
      {/* Frase */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mm-heading mb-9 max-w-3xl text-3xl italic leading-snug sm:text-5xl"
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
          className="mm-button-outline border-brand-wine bg-white/70"
        >
          Nosotros →
        </Link>
      </motion.div>
    </section>
  );
}
