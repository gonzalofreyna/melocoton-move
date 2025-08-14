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
    showOfferBadge: boolean; // 👈 NUEVO
  };

  ui: { brandName: string; themeColor: string };

  // Categorías
  categories: { name: string; image: string; href: string }[];

  // Badge de oferta
  offerBadge: OfferBadgeConfig; // 👈 NUEVO
};

const CONFIG_URL =
  process.env.NEXT_PUBLIC_CONFIG_URL ||
  "https://melocoton-move-assets.s3.us-east-1.amazonaws.com/config.json";

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(CONFIG_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error cargando config: ${res.status}`);
  return res.json();
}
