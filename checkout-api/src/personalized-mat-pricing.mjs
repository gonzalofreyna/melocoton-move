/**
 * Crea tu Mat: pricing authority. Never accept price/discount/total from clients.
 * Keep separate from the standard ecommerce checkout.
 */
export const PERSONALIZED_MAT_DELIVERY_BUSINESS_DAYS = 45;
export const PERSONALIZED_MAT_SHIPPING_POLICY = "quoted_separately";
export const PERSONALIZED_MAT_PROMOS = Object.freeze({
  MSI_5: "msi5",
  FIVE_FOUR: "fiveFour",
});

export function quotePersonalizedMats(input, configuredUnitPrice) {
  const quantity = input?.quantity;
  const promotion = input?.promotion;
  const unitPrice = Number(configuredUnitPrice);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new RangeError("Cantidad inválida: se permiten de 1 a 99 mats.");
  }
  if (!Object.values(PERSONALIZED_MAT_PROMOS).includes(promotion)) {
    throw new RangeError("Modalidad promocional inválida.");
  }
  if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
    throw new Error("Precio del servidor no configurado correctamente.");
  }

  // Integer centavos throughout; rounding for 5% discount is exact half-up.
  const priceCents = unitPrice * 100;
  const originalCents = priceCents * quantity;
  const freeUnits = promotion === PERSONALIZED_MAT_PROMOS.FIVE_FOUR
    ? Math.floor(quantity / 5)
    : 0;
  const totalCents = promotion === PERSONALIZED_MAT_PROMOS.MSI_5
    ? Math.round(originalCents * 95 / 100)
    : priceCents * (quantity - freeUnits);

  return Object.freeze({
    currency: "mxn",
    quantity,
    promotion,
    unitPriceCents: priceCents,
    originalCents,
    totalCents,
    discountCents: originalCents - totalCents,
    freeUnits,
    installmentsAllowed: promotion === PERSONALIZED_MAT_PROMOS.MSI_5,
    deliveryBusinessDays: PERSONALIZED_MAT_DELIVERY_BUSINESS_DAYS,
    shippingPolicy: PERSONALIZED_MAT_SHIPPING_POLICY,
    shippingIncluded: false,
  });
}
