export type CheckoutShippingInput = {
  postalCode: string;
  areaLevel1: string;
  areaLevel2: string;
  areaLevel3: string;

  selectedProvider?: string;
  selectedServiceCode?: string;

  expectedShippingTotal?: number;

  shippingPromoCode?: string;
};

export async function createCheckout(
  items: any[],
  shipping?: CheckoutShippingInput,
) {
  const res = await fetch(process.env.NEXT_PUBLIC_API_CHECKOUT_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      shipping,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.message || "Error en checkout");
  }

  return data;
}

export type PricingPreview = {
  ok: boolean;
  subtotal: number;
  discount: number;
  total: number;
  config: { enabled: boolean; minQty: number; percent: number };
  items: Array<{ slug: string; quantity: number; unitPrice: number; wholesale: boolean }>;
};

export async function getPricingPreview(items: Array<{ slug: string; quantity: number }>, signal?: AbortSignal): Promise<PricingPreview> {
  const checkoutUrl = process.env.NEXT_PUBLIC_API_CHECKOUT_URL;
  if (!checkoutUrl) throw new Error("Falta NEXT_PUBLIC_API_CHECKOUT_URL");
  const url = new URL(checkoutUrl);
  url.pathname = url.pathname.replace(/\/checkout\/?$/, "/pricing");
  if (url.pathname === new URL(checkoutUrl).pathname) throw new Error("URL de checkout no termina en /checkout");
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
    signal,
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.message || "No fue posible calcular el precio");
  return result as PricingPreview;
}
