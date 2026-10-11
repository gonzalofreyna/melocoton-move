import Head from "next/head";
// pages/crea-tu-mat.tsx
import dynamic from "next/dynamic";

const MatCustomizer = dynamic(() => import("../components/MatCustomizer"), {
  ssr: false,
});

export default function CreaTuMatPage() {
  return <>
      <Head>
        <title>Crea tu Mat Personalizado | Melocotón Move</title>
        <meta name="description" content="Personaliza tu mat para yoga o Pilates con Melocotón Move. Descubre nuestras opciones de diseño." />
        <link rel="canonical" href="https://www.melocotonmove.com/crea-tu-mat" />
      </Head>
      <MatCustomizer />
    </>;
}
