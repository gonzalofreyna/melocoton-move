import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="bg-brand-blue text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        {/* Columna izquierda - Links legales */}
        <div>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="/aviso-de-privacidad"
                className="hover:text-brand-beige transition-colors"
              >
                Aviso de Privacidad
              </a>
            </li>
            <li>
              <a
                href="/terminos-y-condiciones"
                className="hover:text-brand-beige transition-colors"
              >
                Términos y Condiciones
              </a>
            </li>
            <li>
              <a
                href="/politica-de-cancelaciones"
                className="hover:text-brand-beige transition-colors"
              >
                Política de Cancelaciones / Devoluciones
              </a>
            </li>
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
            Calcetas deportivas antiderrapantes para Pilates, Barre y más.
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
