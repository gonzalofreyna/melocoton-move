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

type CheckoutItem = ProductView & { quantity: number };

/** Observe a successfully created Stripe checkout URL, without controlling redirect. */
export function reportGa4BeginCheckout(items: CheckoutItem[], coupon?: string): boolean {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) return false;
  try {
    if (localStorage.getItem(ADS_CONSENT_KEY) !== "accepted") return false;
  } catch { return false; }
  if (typeof window.gtag !== "function") return false;
  if (!items.length || items.some((item) =>
    !item.item_id || !item.item_name || !Number.isFinite(item.price) ||
    item.price < 0 || !Number.isInteger(item.quantity) || item.quantity <= 0
  )) return false;
  window.gtag("event", "begin_checkout", {
    transport_type: "beacon",
    currency: "MXN",
    // GA4 ecommerce value excludes shipping and tax, and is the sum of items.
    value: items.reduce((total, item) => total + item.price * item.quantity, 0),
    ...(coupon ? { coupon } : {}),
    items: items.map((item) => ({
      item_id: item.item_id,
      item_name: item.item_name,
      ...(item.item_category ? { item_category: item.item_category } : {}),
      price: item.price,
      quantity: item.quantity,
    })),
  });
  return true;
}

type VerifiedPurchase = {
  transactionId: string;
  amountTotalCents: number;
  currency: string;
  shippingCents?: number | null;
  items: Array<{ description: string | null; quantity: number; amountSubtotal: number }>;
};

/** Called only with details produced by server-verified /success. */
export function reportGa4VerifiedPurchase(purchase: VerifiedPurchase): boolean {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) return false;
  try {
    if (localStorage.getItem(ADS_CONSENT_KEY) !== "accepted") return false;
  } catch { return false; }
  if (typeof window.gtag !== "function") return false;
  const { transactionId, amountTotalCents, currency, shippingCents, items } = purchase;
  if (!transactionId || !Number.isFinite(amountTotalCents) || amountTotalCents < 0 || currency.toUpperCase() !== "MXN") return false;
  if (!items.length || items.some((i) =>
    !Number.isInteger(i.quantity) || i.quantity <= 0 ||
    !Number.isFinite(i.amountSubtotal) || i.amountSubtotal < 0
  )) return false;

  const dedupeKey = "melocoton:ga4:purchase:" + transactionId;
  try {
    if (localStorage.getItem(dedupeKey) === "sent") return false;
  } catch { return false; }

  // Stripe sends money as integer cents. Names are verified line item
  // descriptions; do not invent SKUs absent from the verified receipt.
  window.gtag("event", "purchase", {
    transaction_id: transactionId,
    currency: "MXN",
    // GA4 item revenue excludes shipping; derive from verified receipt lines.
    value: items.reduce((sum, item) => sum + item.amountSubtotal, 0) / 100,
    ...(shippingCents != null && Number.isFinite(shippingCents) && shippingCents >= 0
      ? { shipping: shippingCents / 100 } : {}),
    items: items.map((i, index) => ({
      item_id: i.description || "receipt-item-" + (index + 1),
      item_name: i.description || "Artículo",
      price: i.amountSubtotal / 100 / i.quantity,
      quantity: i.quantity,
    })),
  });
  try { localStorage.setItem(dedupeKey, "sent"); } catch {}
  return true;
}
