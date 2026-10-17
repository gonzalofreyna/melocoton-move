// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const SITE_URL = "https://www.melocotonmove.com";

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Melocotón Move",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/images/logomelocoton.png`,
    description: "Marca en México de tapetes de yoga y Pilates, calcetas antideslizantes y accesorios para la práctica.",
    sameAs: ["https://www.instagram.com/melocoton.move/"],
  };

  const webLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: "Melocotón Move",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Html lang="es">
      <Head>
        {/* OpenAI Ads: habilitar solo tras revisar consentimiento y privacidad. */}
        {process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ENABLED === "true" && (
          <script
            id="openai-ads-pixel"
            dangerouslySetInnerHTML={{
              __html: '!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("init",{pixelId:"TVeQMpjz2WRGsjw89bLGSF",debug:false});',
            }}
          />
        )}
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

        {/* Tipografías nativas del sistema definidas por Tailwind.
            Sin peticiones externas a Google Fonts para cargar fuentes no utilizadas. */}

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
