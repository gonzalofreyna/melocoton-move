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

// 👇 Instagram strip
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

// 👇 Navegación configurable
export type NavItem = {
  label: string;
  enabled?: boolean;
  kind?: "link" | "category" | "onSale" | "popular" | "freeShipping";
  href?: string; // si kind = "link"
  category?: string; // si kind = "category"
};

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

  // Páginas legales
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
  };

  ui: { brandName: string; themeColor: string };

  // Categorías
  categories: { name: string; image: string; href: string }[];

  // Badge de oferta
  offerBadge: OfferBadgeConfig;

  // Instagram (opcional)
  instagramStrip?: InstagramStripConfig;

  // 👇 Navegación (opcional)
  navigation?: {
    primary?: NavItem[];
    quickFilters?: NavItem[];
  };
};

const CONFIG_URL =
  process.env.NEXT_PUBLIC_CONFIG_URL ||
  "https://melocoton-move-assets.s3.us-east-1.amazonaws.com/config.json";

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(CONFIG_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error cargando config: ${res.status}`);

  const raw = (await res.json()) as AppConfig;

  // ===== Normalización SOLO para instagramStrip (respeta el resto tal cual)
  const base = (raw.assets?.baseUrl || "").replace(/\/+$/, "");
  const isHttp = (u?: string) => !!u && /^https?:\/\//i.test(u);
  const abs = (u?: string) => {
    if (!u) return u;
    if (isHttp(u)) return u;
    if (!base) return u;
    return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
  };

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

  // Navegación: se respeta tal cual venga del AC (sin tocarla)
  const navigation = raw.navigation;

  return {
    ...raw,
    instagramStrip,
    navigation,
  };
}
