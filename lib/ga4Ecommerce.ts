import { ADS_CONSENT_KEY } from "../components/AdsConsentBanner";

type ProductView = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
};

/** Returns true only after an opt-in event has been queued for GA4. */
export function reportGa4ProductView(item: ProductView): boolean {
  if (typeof window === "undefined") return false;
  if (!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) return false;
  try {
    if (localStorage.getItem(ADS_CONSENT_KEY) !== "accepted") return false;
  } catch { return false; }
  if (typeof window.gtag !== "function") return false;
  if (!item.item_id || !item.item_name || !Number.isFinite(item.price) || item.price < 0) return false;
  window.gtag("event", "view_item", {
    currency: "MXN",
    value: item.price,
    items: [{
      item_id: item.item_id,
      item_name: item.item_name,
      ...(item.item_category ? { item_category: item.item_category } : {}),
      price: item.price,
      quantity: 1,
    }],
  });
  return true;
}

/** Emits a single-unit add_to_cart after a successful cart addition. */
export function reportGa4AddToCart(item: ProductView, quantity = 1): boolean {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) return false;
  try {
    if (localStorage.getItem(ADS_CONSENT_KEY) !== "accepted") return false;
  } catch { return false; }
  if (typeof window.gtag !== "function") return false;
  if (!item.item_id || !item.item_name || !Number.isFinite(item.price) || item.price < 0) return false;
  if (!Number.isInteger(quantity) || quantity < 1) return false;
  window.gtag("event", "add_to_cart", {
    currency: "MXN",
    value: item.price * quantity,
    items: [{
      item_id: item.item_id,
      item_name: item.item_name,
      ...(item.item_category ? { item_category: item.item_category } : {}),
      price: item.price,
      quantity,
    }],
  });
  return true;
}
