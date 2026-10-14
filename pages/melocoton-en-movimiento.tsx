import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { customerVideos, customerVideoSource, customerVideoPoster } from "../lib/customerVideos";

// Para activar VideoObject es necesario revisar el contenido REAL del video
// y confirmar su fecha de publicación. Nunca inferir esos datos de los hashes
// ni usar la fecha del despliegue como si fuera la fecha de publicación.
// Ejemplo al contar con la información verificada:
// "id-del-video": { title: "Título real", description: "Qué ocurre en el video", uploadDate: "AAAA-MM-DD" }
type VerifiedVideoSeo = { title: string; description: string; uploadDate: string };
type VideoId = (typeof customerVideos)[number]["id"];
const verifiedVideoSeo: Partial<Record<VideoId, VerifiedVideoSeo>> = {};

const PAGE_URL = "https://www.melocotonmove.com/melocoton-en-movimiento";
const FEATURED_POSTER = customerVideoPoster(customerVideos[0].id);

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.melocotonmove.com/" },
    { "@type": "ListItem", position: 2, name: "Melocotón en movimiento", item: PAGE_URL },
  ],
};

const videoSchemas = customerVideos.flatMap((video, index) => {
  const id = video.id;
  const seo = verifiedVideoSeo[id];
  if (!seo || !seo.title.trim() || !seo.description.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(seo.uploadDate) ||
      !Number.isFinite(Date.parse(seo.uploadDate + "T00:00:00Z")) ||
      new Date(seo.uploadDate + "T00:00:00Z").toISOString().slice(0, 10) !== seo.uploadDate) return [];
  return [{
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: seo.title,
    description: seo.description,
    thumbnailUrl: customerVideoPoster(id),
    contentUrl: customerVideoSource(id),
    uploadDate: seo.uploadDate,
    publisher: { "@type": "Organization", name: "Melocotón Move", url: "https://www.melocotonmove.com/" },
    url: `${PAGE_URL}#video-${index + 1}`,
  }];
});

// Evita secuencias HTML incrustadas en los datos estructurados.
const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

type VideoCardProps = {
  id: VideoId;
  index: number;
  featured?: boolean;
};

function VideoCard({ id, index, featured = false }: VideoCardProps) {
  const src = customerVideoSource(id);
  const poster = customerVideoPoster(id);
  const caption = customerVideos[index].title;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!featured) return;
    const video = videoRef.current;
    if (!video) return;

    // En móviles el autoplay suele requerir audio silenciado y playsInline.
    video.defaultMuted = true;
    video.muted = true;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    // Si el navegador bloquea autoplay, sus controles siguen disponibles.
    void video.play().catch(() => {});
  }, [featured]);

  return (
    <figure id={`video-${index + 1}`} className={featured ? "mx-auto w-full max-w-[310px] sm:max-w-[390px]" : "w-[74vw] max-w-[270px] shrink-0 snap-start sm:w-full sm:max-w-none sm:shrink"}>
      <div className="aspect-[9/16] overflow-hidden rounded-[22px] bg-[#211c1b] shadow-[0_16px_44px_rgba(43,30,26,0.14)] sm:rounded-3xl">
        <video
          ref={videoRef}
          controls
          autoPlay={featured}
          muted={featured}
          loop={featured}
          playsInline
          preload={featured ? "auto" : "none"}
          poster={poster}
          aria-label={`${caption} — video de Melocotón Move`}
          className="h-full w-full object-contain"
        >
          <source src={src} type="video/mp4" />
          Tu navegador no puede reproducir este video.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer">Abrir archivo MP4</a>.
        </video>
      </div>
      <figcaption className="mt-3 text-center text-sm font-medium leading-6 text-brand-blue">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function MelocotonEnMovimientoPage() {
  const [featured, ...others] = customerVideos;

  return (
    <>
      <Head>
        <title>Videos de Pilates y yoga | Melocotón Move</title>
        <meta
          name="description"
          content="Conoce Melocotón en movimiento: nueve videos de nuestra comunidad, mats de yoga y Pilates, accesorios y opciones de personalización en México."
        />
        <link
          rel="canonical"
          href={PAGE_URL}
        />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_MX" />
        <meta property="og:title" content="Melocotón en movimiento | Melocotón Move" />
        <meta property="og:description" content="Conoce las historias que nos inspiran, nuestros videos y los mats de yoga y Pilates de Melocotón Move." />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content={FEATURED_POSTER} />
        <meta property="og:image:alt" content="Portada de Melocotón en movimiento" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={FEATURED_POSTER} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
        {videoSchemas.map((schema, index) => (
          <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
        ))}
      </Head>
      <main className="min-h-screen bg-[#fbf8f5] pb-16 pt-5 text-gray-800 sm:pb-20 sm:pt-10">
        <div className="mx-auto w-full max-w-7xl">
          <nav aria-label="Ruta de navegación" className="mb-5 px-4 text-xs text-gray-600 sm:mb-10 sm:px-6 sm:text-sm lg:px-10">
            <Link href="/" className="underline underline-offset-4">Inicio</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span aria-current="page">Melocotón en movimiento</span>
          </nav>

          <section aria-labelledby="video-destacado" className="px-4 sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-lg flex-col gap-5 lg:max-w-none lg:flex-row lg:items-center lg:justify-between lg:gap-14">
              <header className="text-center lg:max-w-xl lg:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-[#81645f] sm:text-xs">
                  Una comunidad en movimiento
                </p>
                <h1 className="mt-2 text-[clamp(1.7rem,7vw,2.25rem)] font-semibold leading-tight tracking-tight text-brand-blue sm:text-5xl">
                  Melocotón en movimiento
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base sm:leading-8 lg:mx-0">
                  Cada práctica tiene su historia. Conoce los momentos
                  que dan vida a Melocotón Move.
                </p>
                <div className="mt-7 hidden flex-wrap gap-5 text-sm font-semibold text-brand-blue lg:flex">
                  <Link className="underline underline-offset-4" href="/tapetes-yoga-pilates">Explorar tapetes</Link>
                  <Link className="underline underline-offset-4" href="/crea-tu-mat">Personalizar mi mat</Link>
                </div>
              </header>
              <div className="w-full shrink-0 lg:w-auto">
                <h2 id="video-destacado" className="sr-only">Lo que nos mueve</h2>
                <VideoCard id={featured.id} index={0} featured />
              </div>
            </div>
          </section>

          <section aria-labelledby="mas-videos" className="mt-12 sm:mt-20">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
              <h2 id="mas-videos" className="text-2xl font-semibold text-brand-blue sm:text-3xl">
                Historias que nos inspiran
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
                Un vistazo a nuestra comunidad, a su propio ritmo. Desliza
                para descubrir más.
              </p>
            </div>

            <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-6 sm:pb-0 md:grid-cols-3 lg:grid-cols-4 lg:px-10">
              {others.map((video, offset) => (
                <VideoCard key={video.id} id={video.id} index={offset + 1} />
              ))}
            </div>
          </section>

          <section aria-labelledby="conoce-nuestra-practica" className="mx-4 mt-14 max-w-3xl border-t border-gray-200 pt-9 sm:mx-auto sm:mt-20 sm:px-6">
            <h2 id="conoce-nuestra-practica" className="text-center text-xl font-semibold text-brand-blue sm:text-2xl">
              Del movimiento a tu práctica
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base sm:leading-8">
              Melocotón Move reúne tapetes de yoga y Pilates, calcetas antideslizantes
              y accesorios para acompañar diferentes formas de movimiento. Aquí compartimos
              nuestra colección audiovisual; para elegir un producto, puedes consultar
              sus materiales, medidas y características en las fichas de la tienda.
            </p>
            <p className="mt-3 text-sm leading-7 text-gray-700 sm:text-base sm:leading-8">
              Si buscas un mat profesional, conoce los modelos con superficie de
              poliuretano de alto grado y base de caucho natural. También puedes explorar
              las opciones de forma y personalización mediante grabado láser desde una pieza.
              Para ejercicios de reformer y barre, descubre nuestra colección de
              calcetas antideslizantes para Pilates.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm font-semibold text-brand-blue">
              <Link className="underline underline-offset-4" href="/tapetes-yoga-pilates">Explorar mats</Link>
              <Link className="underline underline-offset-4" href="/calcetines-antideslizantes-pilates">Ver calcetas de Pilates</Link>
              <Link className="underline underline-offset-4" href="/crea-tu-mat">Crear mi mat</Link>
            </div>
          </section>

          <section className="mx-4 mt-10 max-w-3xl border-t border-gray-200 pt-9 text-center sm:mx-auto sm:mt-14 sm:px-6">
            <h2 className="text-xl font-semibold text-brand-blue">
              Descubre los tapetes y accesorios de Melocotón Move
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
              Explora nuestros tapetes de yoga y Pilates, conoce los materiales
              de cada modelo o diseña un mat con tu logo desde una pieza.
            </p>
            <nav aria-label="Explorar productos" className="mt-6 flex flex-col items-center justify-center gap-4 text-sm font-semibold text-brand-blue sm:flex-row sm:flex-wrap sm:gap-6">
              <Link className="underline underline-offset-4" href="/tapetes-yoga-pilates">
                Ver tapetes
              </Link>
              <Link className="underline underline-offset-4" href="/crea-tu-mat">
                Personalizar mi mat
              </Link>
              <Link className="underline underline-offset-4" href="/guia-elegir-tapete-yoga-pilates">
                Guía de materiales y elección
              </Link>
            </nav>
          </section>
        </div>
      </main>
    </>
  );
}
