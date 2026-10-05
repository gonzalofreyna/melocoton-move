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
  coupon?: string,
  shipping?: CheckoutShippingInput,
) {
  const res = await fetch(process.env.NEXT_PUBLIC_API_CHECKOUT_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      coupon,
      shipping,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.message || "Error en checkout");
  }

  return data;
}
