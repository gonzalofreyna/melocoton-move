import "../styles/globals.css";
import type { AppProps } from "next/app";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TopBanner from "../components/TopBanner";
import Head from "next/head";

// Importa el CartProvider
import { CartProvider } from "../context/CartContext";

// 👇 Importa el ConfigProvider (usa la ruta que tengas; aquí relativa)
import { ConfigProvider } from "../context/ConfigContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      {/* 👇 Envolvemos TODO con el ConfigProvider: la app cargará el AC 1 sola vez */}
      <ConfigProvider>
        <>
          <Head>
            {/* Favicon SVG principal */}
            <link
              rel="icon"
              href="/images/logomelocoton.svg"
              type="image/svg+xml"
            />

            {/* Respaldo PNG */}
            <link
              rel="alternate icon"
              href="/images/logomelocoton.png"
              type="image/png"
            />

            {/* (Opcional) iOS pantalla de inicio */}
            {/* <link rel="apple-touch-icon" href="/images/logomelocoton.png" /> */}
          </Head>

          <div className="flex flex-col min-h-screen">
            <TopBanner />
            <Header />
            <main className="flex-1 pt-32">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
        </>
      </ConfigProvider>
    </CartProvider>
  );
}
