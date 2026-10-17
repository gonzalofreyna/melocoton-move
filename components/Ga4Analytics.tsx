import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ADS_CONSENT_EVENT, ADS_CONSENT_KEY } from "./AdsConsentBanner";

const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
let initialized = false;
let lastPage = "";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: Gtag;
    [key: `ga-disable-${string}`]: unknown;
  }
}

function isAllowed(): boolean {
  try { return localStorage.getItem(ADS_CONSENT_KEY) === "accepted"; }
  catch { return false; }
}

function sendPageView(path: string) {
  if (!measurementId || !window.gtag || !isAllowed()) return;
  const fullUrl = window.location.origin + path;
  if (lastPage === fullUrl) return;
  lastPage = fullUrl;
  window.gtag("event", "page_view", {
    page_location: fullUrl,
    page_title: document.title,
  });
}

function enableAnalytics(onReady: () => void) {
  if (!measurementId || !isAllowed()) return;
  window[`ga-disable-${measurementId}`] = false;
  if (initialized) {
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    onReady();
    return;
  }

  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(..._args: unknown[]) { window.dataLayer?.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.id = "melocoton-ga4";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.onload = () => {
    if (isAllowed()) {
      onReady();
      window.dispatchEvent(new Event("melocoton:ga4-ready"));
    }
  };
  script.onerror = () => { initialized = false; };
  document.head.appendChild(script);
}

function disableAnalytics() {
  if (!measurementId) return;
  window[`ga-disable-${measurementId}`] = true;
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  lastPage = "";
}

/** Client-only GA4 page views. The SDK is never requested before opt-in. */
export default function Ga4Analytics() {
  const router = useRouter();
  const currentPath = useRef(router.asPath);
  currentPath.current = router.asPath;

  // Next.js has committed the new page by the time this effect runs. Wait for
  // the next paints so next/head can update document.title as well.
  useEffect(() => {
    if (!measurementId || !router.isReady) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (currentPath.current === router.asPath) sendPageView(router.asPath);
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [router.asPath, router.isReady]);

  useEffect(() => {
    if (!measurementId) return;
    const update = () => {
      if (isAllowed()) {
        enableAnalytics(() => {
          // On consent and script load, use the latest location rather than a
          // stale route captured before an asynchronous script load.
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              sendPageView(currentPath.current);
            });
          });
        });
      } else {
        disableAnalytics();
      }
    };
    update();
    window.addEventListener(ADS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ADS_CONSENT_EVENT, update);
  }, []);

  return null;
}
