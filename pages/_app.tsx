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

// Franja Instagram
import InstagramStrip from "../components/InstagramStrip";

// Carrito flotante (icono)
import FloatingCart from "../components/FloatingCart";

// 🧩 Nuevo: drawer lateral del carrito
import MiniCart from "../components/MiniCart";

import MobileNavbar from "../components/MobileNavbar";

function AppShell({ Component, pageProps }: AppProps) {
  const { config } = useAppConfig();
  const ig = config?.instagramStrip;

  const IG_USER =
    process.env.NEXT_PUBLIC_IG_USERNAME?.trim() || "melocoton.move";
  const IG_URL =
    process.env.NEXT_PUBLIC_IG_URL?.trim() ||
    `https://instagram.com/${IG_USER}`;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="/images/logomelocoton.svg"
          type="image/svg+xml"
        />
        <link
          rel="alternate icon"
          href="/images/logomelocoton.png"
          type="image/png"
        />
      </Head>

      <div className="flex flex-col min-h-screen">
        <TopBanner />
        <Header />

        <main className="flex-1 pt-32">
          <Component {...pageProps} />
        </main>

        {ig?.enabled ? (
          <InstagramStrip
            username={ig.username}
            url={ig.url}
            items={ig.items}
          />
        ) : (
          <InstagramStrip username={IG_USER} url={IG_URL} />
        )}

        <Footer />

        {/* 🧩 Drawer lateral del carrito */}
        <MiniCart />
        <MobileNavbar />
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
