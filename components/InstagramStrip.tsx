import React from "react";

type MediaItem = {
  type: "image" | "video";
  src: string; // URL de la imagen o del video (mp4/webm)
  alt?: string; // texto accesible
  poster?: string; // thumbnail para el <video>
};

type Props = {
  username?: string;
  url?: string;
  /** Compat: si pasas 'images' seguirá funcionando (se convierten a items tipo 'image') */
  images?: string[];
  items?: MediaItem[]; // mezcla de imágenes y videos
};

const DEFAULT_IMAGES: string[] = [
  "/images/weightedring.jpeg",
  "/images/weights.jpeg",
  "/images/bola.jpeg",
  "/images/bandas.jpeg",
  "/images/bolsa.jpeg",
];

export default function InstagramStrip({
  username = "melocoton.move",
  url = "https://www.instagram.com/stories/melocoton.move/",
  images,
  items,
}: Props) {
  // Backwards compatible: si recibimos 'images', las convertimos a items
  const media: MediaItem[] =
    items ?? (images ?? DEFAULT_IMAGES).map((src) => ({ type: "image", src }));

  return (
    <section className="bg-[#F7EFE9]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base md:text-lg font-medium tracking-wide hover:opacity-80"
            aria-label={`Abrir Instagram de @${username}`}
          >
            @{username}
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm uppercase tracking-widest hover:opacity-80"
            aria-label="Abrir Instagram (Follow us)"
          >
            Follow us
          </a>
        </div>

        {/* Grid de medios (imágenes / videos) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {media.map((item, i) => (
            <a
              key={(item.src || "") + i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl overflow-hidden bg-white shadow hover:shadow-lg transition"
              aria-label={`Abrir Instagram: item ${i + 1}`}
            >
              <div className="aspect-[4/3] md:aspect-square">
                {item.type === "video" ? (
                  <video
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none"
                    src={item.src}
                    poster={item.poster}
                    muted
                    autoPlay
                    loop
                    playsInline
                    preload="none"
                    // Nota: 'controls' quitado para que el click navegue al IG.
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.alt || `Instagram preview ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
