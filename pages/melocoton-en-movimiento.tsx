import Head from "next/head";
import Link from "next/link";

// Los nueve videos provienen de los enlaces S3 entregados por Melocotón Move.
// Las portadas siguen los nombres locales preparados con FFmpeg; comprobar
// que todas las WebP estén en S3 antes de aprobar el PR.
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
  const poster = `${MEDIA_BASE}${id}-poster.webp`;

  return (
    <figure className={featured ? "mx-auto w-full max-w-[430px]" : "w-full min-w-0"}>
      <div className="overflow-hidden rounded-2xl bg-[#211c1b] shadow-sm">
        <video
          controls
          playsInline
          preload="none"
          poster={poster}
          aria-label={featured ? "Video destacado de Melocotón Move" : `Video ${index + 1} de Melocotón Move`}
          className="aspect-[9/16] w-full object-contain"
        >
          <source src={src} type="video/mp4" />
          Tu navegador no puede reproducir este video.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer">Abrir archivo MP4</a>.
        </video>
      </div>
      <figcaption className="mt-3 text-sm text-gray-600">
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
      <main className="min-h-screen bg-[#fbf8f5] px-4 py-10 text-gray-800 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Ruta de navegación" className="mb-8 text-sm text-gray-600">
            <Link href="/" className="underline underline-offset-4">Inicio</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span aria-current="page">Melocotón en movimiento</span>
          </nav>

          <header className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#81645f]">
              Historias en video
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-brand-blue sm:text-5xl">
              Melocotón en movimiento
            </h1>
            <p className="mt-5 text-sm leading-7 text-gray-600 sm:text-base">
              Una selección de videos de Melocotón Move para descubrir nuestra
              comunidad y ver nuestros productos en movimiento. Conoce también
              los materiales y opciones de nuestros mats en sus fichas.
            </p>
          </header>

          <section aria-labelledby="video-destacado" className="mt-10 text-center sm:mt-14">
            <h2 id="video-destacado" className="mb-6 text-lg font-semibold text-brand-blue sm:text-xl">
              Una mirada a Melocotón Move
            </h2>
            <VideoCard id={featuredId} index={0} featured />
          </section>

          <section aria-labelledby="mas-videos" className="mt-14 sm:mt-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="mas-videos" className="text-2xl font-semibold text-brand-blue sm:text-3xl">
                Más momentos de Melocotón
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
                Explora el resto de nuestra colección audiovisual. Los videos
                se reproducen cuando tú eliges; no se inician automáticamente.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
              {otherIds.map((id, offset) => (
                <VideoCard key={id} id={id} index={offset + 1} />
              ))}
            </div>
          </section>

          <section className="mx-auto mt-16 max-w-3xl border-t border-gray-200 pt-9 text-center sm:mt-20">
            <h2 className="text-xl font-semibold text-brand-blue">
              Descubre los tapetes y accesorios de Melocotón Move
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
              Explora nuestros tapetes de yoga y Pilates, conoce los materiales
              de cada modelo o diseña un mat con tu logo desde una pieza.
            </p>
            <nav aria-label="Explorar productos" className="mt-6 flex flex-wrap justify-center gap-5 text-sm font-semibold text-brand-blue">
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
