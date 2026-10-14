import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef } from "react";

// Los nueve videos provienen de los enlaces S3 entregados por Melocotón Move.
// Los MP4 están en /videos/customers/ y las portadas WebP en /videos/customers/portada/.
// Confirmar acceso HTTP público a ambos tipos de recurso antes del merge.
const MEDIA_BASE =
  "https://melocoton-move-assets.s3.us-east-1.amazonaws.com/videos/customers/";

const videoIds = [
  "4125f23c3a9141589692e1587489afbe", // Destacado elegido por la marca
  "24db6552be06494c896b8e4e482cfd74",
  "2ae15857335243c985f2bf61e3f2bd6f",
  "3e88ea26526f4bb3acdf65239cdbc18c",
  "673bb17dd6d44ead98ce01abeef94d76",
  "6d8f1b55f2534a3e9861e4e48876b79f",
  "a342be43105946bc913bc623834ba666",
  "b73ecf845b974c5e84f2ab9ba63d49a2",
  "df5886d824ca4205bd90273183390973",
] as const;

type VideoCardProps = {
  id: (typeof videoIds)[number];
  index: number;
  featured?: boolean;
};

function VideoCard({ id, index, featured = false }: VideoCardProps) {
  const src = `${MEDIA_BASE}${id}.mp4`;
  const poster = `${MEDIA_BASE}portada/${id}-poster.webp`;
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
    <figure className={featured ? "mx-auto w-full max-w-[310px] sm:max-w-[390px]" : "w-[74vw] max-w-[270px] shrink-0 snap-start sm:w-full sm:max-w-none sm:shrink"}>
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
          aria-label={featured ? "Video destacado de Melocotón Move" : `Video ${index + 1} de Melocotón Move`}
          className="h-full w-full object-contain"
        >
          <source src={src} type="video/mp4" />
          Tu navegador no puede reproducir este video.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer">Abrir archivo MP4</a>.
        </video>
      </div>
      <figcaption className="mt-2 text-center text-sm leading-6 text-gray-600">
        {featured ? "Video destacado de Melocotón Move" : `Video ${index + 1} de la colección`}
      </figcaption>
    </figure>
  );
}

export default function MelocotonEnMovimientoPage() {
  const [featuredId, ...otherIds] = videoIds;

  return (
    <>
      <Head>
        <title>Melocotón en movimiento | Videos de yoga y Pilates | Melocotón Move</title>
        <meta
          name="description"
          content="Descubre videos de Melocotón Move y explora nuestros tapetes de yoga y Pilates, opciones de personalización y accesorios para tu práctica en México."
        />
        <link
          rel="canonical"
          href="https://www.melocotonmove.com/melocoton-en-movimiento"
        />
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
                  Historias en video
                </p>
                <h1 className="mt-2 text-[clamp(1.7rem,7vw,2.25rem)] font-semibold leading-tight tracking-tight text-brand-blue sm:text-5xl">
                  Melocotón en movimiento
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base sm:leading-8 lg:mx-0">
                  Descubre nuestra comunidad y los productos de Melocotón Move
                  a través de una selección de videos.
                </p>
                <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                  El video destacado inicia sin sonido. Puedes activarlo desde el reproductor.
                </p>
                <div className="mt-7 hidden flex-wrap gap-5 text-sm font-semibold text-brand-blue lg:flex">
                  <Link className="underline underline-offset-4" href="/tapetes-yoga-pilates">Explorar tapetes</Link>
                  <Link className="underline underline-offset-4" href="/crea-tu-mat">Personalizar mi mat</Link>
                </div>
              </header>
              <div className="w-full shrink-0 lg:w-auto">
                <h2 id="video-destacado" className="sr-only">Video destacado</h2>
                <VideoCard id={featuredId} index={0} featured />
              </div>
            </div>
          </section>

          <section aria-labelledby="mas-videos" className="mt-12 sm:mt-20">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
              <h2 id="mas-videos" className="text-2xl font-semibold text-brand-blue sm:text-3xl">
                Más momentos de Melocotón
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
                Explora los demás videos de nuestra colección. Desliza para verlos en
                tu celular y toca reproducir el que quieras.
              </p>
            </div>

            <div className="-mx-0 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-6 sm:pb-0 md:grid-cols-3 lg:grid-cols-4 lg:px-10">
              {otherIds.map((id, offset) => (
                <VideoCard key={id} id={id} index={offset + 1} />
              ))}
            </div>
          </section>

          <section className="mx-4 mt-14 max-w-3xl border-t border-gray-200 pt-9 text-center sm:mx-auto sm:mt-20 sm:px-6">
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
