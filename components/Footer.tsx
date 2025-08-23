import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchConfig, AppConfig } from "../lib/fetchConfig";

export default function Footer() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchConfig();
        setConfig(data);
      } catch (err) {
        console.error("Error cargando configuración en Footer:", err);
      }
    })();
  }, []);

  return (
    <footer className="bg-brand-blue text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        {/* Columna izquierda - Links legales */}
        <div>
          <ul className="space-y-2 text-sm">
            {config?.featureFlags.showPrivacyPolicy && (
              <li>
                <Link
                  href="/legal/aviso-de-privacidad"
                  className="hover:text-brand-beige transition-colors"
                >
                  {config.privacyPolicy.title}
                </Link>
              </li>
            )}
            {config?.featureFlags.showTermsAndConditions && (
              <li>
                <Link
                  href="/legal/terminos-y-condiciones"
                  className="hover:text-brand-beige transition-colors"
                >
                  {config.termsAndConditions.title}
                </Link>
              </li>
            )}
            {config?.featureFlags.showReturnPolicy && (
              <li>
                <Link
                  href="/legal/politica-de-cancelaciones"
                  className="hover:text-brand-beige transition-colors"
                >
                  {config.returnPolicy.title}
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Columna central - Logo y frase */}
        <div className="flex flex-col items-center">
          <img
            src="/images/logomelocoton.svg"
            alt="Melocotón Move"
            className="h-16 mb-4"
          />
          <p className="text-sm text-gray-200 max-w-xs text-center">
            Mt 13:31-32
          </p>
        </div>

        {/* Columna derecha - Contacto */}
        <div className="flex flex-col space-y-4 items-center md:items-end">
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="h-5 w-5" />
            <a
              href="mailto:contacto@melocotonmove.com"
              className="hover:text-brand-beige transition-colors"
            >
              contacto@melocotonmove.com
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <FaWhatsapp className="h-5 w-5" />
            <a
              href="https://api.whatsapp.com/send?phone=%2B523310125501"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-beige transition-colors"
            >
              +52 33 1012 5501
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <FaInstagram className="h-5 w-5" />
            <a
              href="https://www.instagram.com/melocoton.move/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-beige transition-colors"
            >
              @melocoton.move
            </a>
          </div>
        </div>
      </div>

      {/* Derechos de autor */}
      <div className="bg-brand-blue/90 py-4 text-center text-sm text-gray-200 border-t border-white/10">
        © {new Date().getFullYear()} Melocotón — Todos los derechos reservados
      </div>
    </footer>
  );
}
