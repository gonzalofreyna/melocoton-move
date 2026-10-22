/** Server-side pricing authority for personalized mats. Amounts in cents. */
export const PERSONALIZED_MAT_UNIT_PRICE_MXN = 1399;
export const PERSONALIZED_MAT_DELIVERY_BUSINESS_DAYS = 45;
export const PERSONALIZED_MAT_SHIPPING_POLICY = "quoted_separately";
export const PERSONALIZED_MAT_PROMOS = Object.freeze({
  SINGLE_10: "single10",
  MSI_15: "msi15",
  VOLUME_20: "volume20",
});
export function quotePersonalizedMats(input, configuredUnitPrice) {
  const { quantity, promotion } = input ?? {};
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new RangeError("Cantidad inválida: se permiten de 1 a 99 mats.");
  }
  if (!Object.values(PERSONALIZED_MAT_PROMOS).includes(promotion) ||
      (quantity < 5 && promotion !== PERSONALIZED_MAT_PROMOS.SINGLE_10) ||
      (quantity >= 5 && promotion === PERSONALIZED_MAT_PROMOS.SINGLE_10)) {
    throw new RangeError("Modalidad promocional inválida.");
  }
  const unitPrice = Number(configuredUnitPrice);
  if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
    throw new Error("Precio del servidor no configurado correctamente.");
  }
  const priceCents = unitPrice * 100;
  const originalCents = priceCents * quantity;
  const percentage = promotion === PERSONALIZED_MAT_PROMOS.SINGLE_10 ? 90
    : promotion === PERSONALIZED_MAT_PROMOS.MSI_15 ? 85 : 80;
  const discountedUnitCents = Math.round(priceCents * percentage / 100);
  const totalCents = discountedUnitCents * quantity;
  return Object.freeze({
    currency: "mxn", quantity, promotion, unitPriceCents: priceCents,
    discountedUnitCents, originalCents, totalCents,
    discountCents: originalCents - totalCents, freeUnits: 0,
    installmentsAllowed: promotion === PERSONALIZED_MAT_PROMOS.MSI_15,
    deliveryBusinessDays: PERSONALIZED_MAT_DELIVERY_BUSINESS_DAYS,
    shippingPolicy: PERSONALIZED_MAT_SHIPPING_POLICY,
    shippingIncluded: false,
  });
}

/** Verify historical Stripe sessions; never use this for a new checkout. */
export function quoteLegacyPersonalizedMats(input) {
  const { quantity, promotion } = input ?? {};
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99 ||
      !["msi5", "fiveFour", "volume20"].includes(promotion) ||
      (promotion === "volume20" && quantity < 5)) {
    throw new RangeError("Promoción histórica inválida.");
  }
  const unitPriceCents = 149900;
  const originalCents = unitPriceCents * quantity;
  const freeUnits = promotion === "fiveFour" ? Math.floor(quantity / 5) : 0;
  const totalCents = promotion === "msi5" ? Math.round(originalCents * 95 / 100)
    : promotion === "volume20" ? Math.round(originalCents * 80 / 100)
    : unitPriceCents * (quantity - freeUnits);
  return { quantity, promotion, unitPriceCents, originalCents,
    totalCents, freeUnits };
}
