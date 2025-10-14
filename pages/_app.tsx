// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

// 🧩 Componentes globales
import Header from "../components/Header";
import Footer from "../components/Footer";
import TopBanner from "../components/TopBanner";
import InstagramStrip from "../components/InstagramStrip";
import MiniCart from "../components/MiniCart";
import MobileNavbar from "../components/MobileNavbar";

// 🧠 Contextos
import { CartProvider } from "../context/CartContext";
import { ConfigProvider, useAppConfig } from "../context/ConfigContext";
import { ProductsProvider } from "../context/ProductsContext";

/** ===== AppShell: UI principal ===== */
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
      {/* 🔹 Head se simplifica: solo cosas dinámicas o por página */}
      <Head>
        <title>Melocotón Move</title>
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
        <MiniCart />
        <MobileNavbar />
      </div>
    </>
  );
}

/** ===== App raíz con Providers ===== */
export default function MyApp(props: AppProps) {
  return (
    <CartProvider>
      <ConfigProvider>
        <ProductsProvider>
          <AppShell {...props} />
        </ProductsProvider>
      </ConfigProvider>
    </CartProvider>
  );
}
