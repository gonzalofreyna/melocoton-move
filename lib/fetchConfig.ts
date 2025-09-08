// lib/fetchConfig.ts
export type InfoSection = { title: string; content: string };

export type OfferBadgeConfig = {
  enabled: boolean;
  mode: "text" | "icon" | "both";
  text: string;
  shape: "pill" | "rounded" | "square";
  size: "sm" | "md" | "lg";
  uppercase: boolean;
  colors: { bg: string; text: string; border: string };
  icon: { enabled: boolean; src: string; alt: string; size: number };
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export type InstagramMediaItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
  href?: string | null;
  alt?: string;
};

export type InstagramStripConfig = {
  enabled: boolean;
  username?: string;
  url?: string;
  items: InstagramMediaItem[];
};

export type NavItem = {
  label: string;
  enabled?: boolean;
  kind?: "link" | "category" | "onSale" | "popular" | "freeShipping";
  href?: string;
  category?: string;
};

export type PromoModalCountdownConfig = {
  enabled: boolean;
  launchAt: string; // ISO 8601 recomendado
  afterText?: string;
  showWhenExpired?: boolean;
};

export type PromoModalConfig = {
  enabled: boolean;
  title?: string;
  text?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
  imageAlt?: string;
  imageLink?: string | null;
  secondaryText?: string;
  secondaryLink?: string;
  frequency?: "once" | "daily" | "always";
  storageKey?: string;
  countdown?: PromoModalCountdownConfig;
};

/** ========= Tipos para eventos ========= */
export type EventBadge = string | { label: string };

export type EventItem = {
  id?: string | number;
  title: string;
  artist?: string;
  date: string; // ISO
  city: string;
  venue: string;
  time?: string;
  image: string; // puede ser relativa; se normaliza con assets.baseUrl
  href?: string;
  badges?: EventBadge[];
};

export type EventsConfig = {
  enabled: boolean;
  header?: { title?: string; subtitle?: string };
  seeAll?: { enabled?: boolean; href?: string; label?: string };
  items: EventItem[];
};
/** ===================================== */

/** ========= NUEVO: Opening Studio ========= */
export type OpeningStudioConfig = {
  enabled: boolean;
  image: string; // relativa o absoluta
  title: string;
  description: string;
  buttonText: string;
  buttonHref?: string; // default: /products?category=reformer
};
/** ======================================== */

export type AppConfig = {
  version: number;
  updatedAt: string;

  topBanner: { text: string; enabled: boolean; link: string | null };
  assets: { baseUrl: string };

  hero: {
    desktopImage: string;
    mobileImage: string;
    title: string;
    alt: string;
    focalPoint: { x: number; y: number };
    overlay: { enabled: boolean; opacity: number };
    cta: { text: string; href: string; enabled: boolean };
  };

  puntosDeVentaHeader: { title: string; subtitle: string };
  puntosDeVenta: { estado: string; logo: string }[];

  benefits: {
    enabled: boolean;
    header: string;
    items: { title: string; text: string }[];
  };

  finalCTA: {
    enabled: boolean;
    backgroundImage: string;
    overlayOpacity: number;
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };

  termsAndConditions: { title: string; sections: InfoSection[] };
  returnPolicy: { title: string; sections: InfoSection[] };
  privacyPolicy: { title: string; sections: InfoSection[] };

  featureFlags: {
    showHero: boolean;
    showPuntosDeVenta: boolean;
    showTopBanner: boolean;
    showBenefits: boolean;
    showFinalCTA: boolean;
    showTermsAndConditions: boolean;
    showReturnPolicy: boolean;
    showPrivacyPolicy: boolean;
    showOfferBadge: boolean;
    /** 👇 NUEVO */
    showOpeningStudio?: boolean;
  };

  ui: { brandName: string; themeColor: string };
  categories: { name: string; image: string; href: string }[];
  offerBadge: OfferBadgeConfig;

  instagramStrip?: InstagramStripConfig;
  navigation?: { primary?: NavItem[]; quickFilters?: NavItem[] };
  promoModal?: PromoModalConfig;

  /** Sección de eventos */
  events?: EventsConfig;

  /** 👇 NUEVO: sección Opening Studio */
  openingStudio?: OpeningStudioConfig;
};

// ✅ Solo API (sin fallback a S3)
const API_CONFIG_URL = process.env.NEXT_PUBLIC_API_CONFIG_URL!;
if (!API_CONFIG_URL) {
  throw new Error("Falta NEXT_PUBLIC_API_CONFIG_URL");
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(API_CONFIG_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error cargando config: ${res.status}`);

  const raw = (await res.json()) as AppConfig;

  // ===== Utilidades de normalización
  const base = (raw.assets?.baseUrl || "").replace(/\/+$/, "");
  const isHttp = (u?: string) => !!u && /^https?:\/\//i.test(u);
  const abs = (u?: string) => {
    if (!u) return u;
    if (isHttp(u)) return u;
    if (!base) return u;
    return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  // ===== Normalización SOLO para instagramStrip
  let instagramStrip: InstagramStripConfig | undefined = raw.instagramStrip;
  if (instagramStrip) {
    instagramStrip = {
      enabled: !!instagramStrip.enabled,
      username: instagramStrip.username,
      url:
        instagramStrip.url ||
        (instagramStrip.username
          ? `https://instagram.com/${instagramStrip.username}`
          : undefined),
      items: Array.isArray(instagramStrip.items)
        ? (instagramStrip.items
            .map((it) => {
              const type: "image" | "video" =
                it?.type === "video" ? "video" : "image";
              const src = abs(it?.src);
              if (!src) return null;
              return {
                type,
                src,
                poster: abs(it?.poster),
                href: it?.href ?? undefined,
                alt: it?.alt ?? undefined,
              } as InstagramMediaItem;
            })
            .filter(Boolean) as InstagramMediaItem[])
        : [],
    };
  }

  // ===== Normalización para promoModal.image
  let promoModal: PromoModalConfig | undefined = raw.promoModal;
  if (promoModal?.image) {
    promoModal = { ...promoModal, image: abs(promoModal.image) };
  }

  // ===== NUEVO: Normalización para openingStudio
  let openingStudio = raw.openingStudio;
  if (openingStudio?.image) {
    openingStudio = {
      ...openingStudio,
      image: abs(openingStudio.image),
      buttonHref: openingStudio.buttonHref || "/products?category=reformer",
    };
  }

  // ===== Normalización para events (imgs relativas -> absolutas)
  let events = raw.events;
  if (events?.items?.length) {
    events = {
      ...events,
      items: events.items
        .map((it, i) => ({
          id: it.id ?? i,
          title: it.title,
          artist: it.artist,
          date: it.date,
          city: it.city,
          venue: it.venue,
          time: it.time,
          image: abs(it.image),
          href: it.href,
          badges: Array.isArray(it.badges) ? it.badges : [],
        }))
        .filter((it) => !!it.title && !!it.date && !!it.image),
    };
  }

  const navigation = raw.navigation;

  return {
    ...raw,
    instagramStrip,
    navigation,
    promoModal,
    events,
    openingStudio, // 👈 incluye Opening Studio normalizado
  };
}
