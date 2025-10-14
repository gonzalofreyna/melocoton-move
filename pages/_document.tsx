// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://main.d15wjbc4ifk2rq.amplifyapp.com"
  ).replace(/\/$/, "");

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Melocotón Move",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logomelocoton.png`,
  };

  const webLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE_URL,
    name: "Melocotón Move",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Html lang="es">
      <Head>
        {/* 🖼️ Favicon */}
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

        {/* 📱 Viewport optimizado para móviles */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />

        {/* Perf de fuentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD global */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webLd) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
