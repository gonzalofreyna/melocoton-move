export async function createCheckout(items: any[], coupon?: string) {
  const res = await fetch(process.env.NEXT_PUBLIC_API_CHECKOUT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, coupon }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error en checkout");
  return data; // devuelve { id, url, shippingLabel }
}
