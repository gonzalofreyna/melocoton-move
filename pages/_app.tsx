// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TopBanner from "../components/TopBanner";
import Head from "next/head";

// Contextos
import { CartProvider } from "../context/CartContext";
import { ConfigProvider, useAppConfig } from "../context/ConfigContext";

// Franja Instagram (acepta imágenes y videos)
import InstagramStrip from "../components/InstagramStrip";

// 👇 Nuevo: carrito flotante
import FloatingCart from "../components/FloatingCart";

// Componente interno para poder usar el hook dentro del Provider
function AppShell({ Component, pageProps }: AppProps) {
  const { config } = useAppConfig(); // 👈 CORREGIDO
  const ig = config?.instagramStrip;

  // Fallback opcional desde ENV si no hay sección en el AC
  const IG_USER =
    process.env.NEXT_PUBLIC_IG_USERNAME?.trim() || "melocoton.move";
  const IG_URL =
    process.env.NEXT_PUBLIC_IG_URL?.trim() ||
    `https://instagram.com/${IG_USER}`;

  return (
    <>
      <Head>
        {/* Viewport global */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

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
        {/* <link rel="apple-touch-icon" href="/images/logomelocoton.png" /> */}
      </Head>

      <div className="flex flex-col min-h-screen">
        <TopBanner />
        <Header />

        <main className="flex-1 pt-32">
          <Component {...pageProps} />
        </main>

        {/* 👇 Siempre arriba del Footer — sale del AC si existe y está enabled */}
        {ig?.enabled ? (
          <InstagramStrip
            username={ig.username}
            url={ig.url}
            items={ig.items}
          />
        ) : (
          // Fallback mínimo (sin items) si aún no configuras la sección en el AC
          <InstagramStrip username={IG_USER} url={IG_URL} />
        )}

        <Footer />

        {/* 👉 Carrito flotante global (se oculta automáticamente en /cart) */}
        <FloatingCart />
      </div>
    </>
  );
}

export default function MyApp(props: AppProps) {
  return (
    <CartProvider>
      <ConfigProvider>
        <AppShell {...props} />
      </ConfigProvider>
    </CartProvider>
  );
}
