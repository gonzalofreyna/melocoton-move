/** OpenAI Ads browser purchase measurement, isolated for deterministic tests. */
export type PurchaseEventInput = {
  ok: boolean;
  orderId?: string | null;
  amountTotal?: number;
  currency?: string;
  enabled: boolean;
};
export type PurchaseEventDependencies = {
  consent: () => boolean;
  previouslySent: (key: string) => boolean;
  markSent: (key: string) => void;
  measure: (...args: unknown[]) => void;
};
export function reportOpenAiPurchase(input: PurchaseEventInput, deps: PurchaseEventDependencies): boolean {
  const { ok, orderId, amountTotal, currency, enabled } = input;
  if (!enabled || !ok || !orderId || !orderId.startsWith("cs_live_") ||
      !Number.isInteger(amountTotal) || (amountTotal ?? 0) < 0 || !currency) return false;
  if (!deps.consent()) return false;
  const key = `openai_ads_order_created:${orderId}`;
  if (deps.previouslySent(key)) return false;
  deps.measure("measure", "order_created", {
    type: "contents",
    amount: amountTotal,
    currency: currency.toUpperCase(),
  }, { event_id: orderId });
  deps.markSent(key);
  return true;
}
