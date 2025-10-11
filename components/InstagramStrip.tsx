"use client";

import React from "react";

type MediaItem = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

type Props = {
  username?: string;
  url?: string;
  images?: string[];
  items?: MediaItem[];
};

export default function InstagramStrip({
  username = "melocoton.move",
  url = "https://www.instagram.com/melocoton.move/",
  images,
  items,
}: Props) {
  const fromImages: MediaItem[] = Array.isArray(images)
    ? images.filter(Boolean).map((src) => ({ type: "image" as const, src }))
    : [];

  const media: MediaItem[] =
    Array.isArray(items) && items.length
      ? items
          .filter((it) => Boolean(it && it.src))
          .map((it) => ({
            type: it.type === "video" ? "video" : "image",
            src: it.src,
            alt: it.alt,
            poster: it.poster,
          }))
      : fromImages;

  if (!media.length) return null;

  return (
    <section className="bg-brand-blue">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-base md:text-lg font-medium tracking-wide hover:text-brand-beige"
            aria-label={`Abrir Instagram de @${username}`}
          >
            @{username}
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm uppercase tracking-widest hover:text-brand-beige"
            aria-label="Abrir Instagram (Follow us)"
          >
            Follow us
          </a>
        </div>

        {/* 📱 Scroll horizontal en móvil */}
        <div className="md:hidden overflow-x-auto flex gap-4 pb-4 scrollbar-hide snap-x snap-mandatory">
          {media.map((item, i) => (
            <a
              key={item.src + i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none w-48 snap-start rounded-2xl overflow-hidden bg-white shadow hover:shadow-lg transition"
              aria-label={`Abrir Instagram: item ${i + 1}`}
            >
              <div className="aspect-square">
                {item.type === "video" ? (
                  <video
                    className="w-full h-full object-cover"
                    src={item.src}
                    poster={item.poster}
                    muted
                    autoPlay
                    loop
                    playsInline
                    preload="none"
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.alt || `Instagram preview ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            </a>
          ))}
        </div>

        {/* 💻 Grid normal para desktop */}
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
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
