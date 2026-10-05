import {
  getSkydropxToken,
  getAddressTemplates,
  createQuotation,
  getQuotation,
} from "./skydropx.mjs";

import { getPostalCodeData } from "./postal-code.mjs";

async function getTrustedShippingProducts(items) {
  const ecommerceApiUrl = process.env.ECOMMERCE_API_URL;
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (!ecommerceApiUrl) {
    throw new Error("Falta ECOMMERCE_API_URL");
  }

  if (!internalApiKey) {
    throw new Error("Falta INTERNAL_API_KEY");
  }

  const res = await fetch(`${ecommerceApiUrl}/internal/shipping/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": internalApiKey,
    },
    body: JSON.stringify({
      items,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    console.error("Ecommerce shipping products error:", {
      status: res.status,
      data,
    });

    throw new Error(
      data?.error || data?.message || `Error ecommerce-api HTTP ${res.status}`,
    );
  }

  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForQuotation(quotationId) {
  const MAX_ATTEMPTS = 12;
  const DELAY_MS = 500;
  const MIN_ATTEMPTS = 4;
  const STABLE_POLLS_REQUIRED = 3;

  let lastQuotation = null;
  let previousSuccessfulCount = -1;
  let stablePolls = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const quotation = await getQuotation(quotationId);

    lastQuotation = quotation;

    const quotationData = quotation?.data || quotation;

    const rates = Array.isArray(quotationData?.rates)
      ? quotationData.rates
      : [];

    const successfulRates = rates.filter(
      (rate) =>
        rate?.success === true &&
        rate?.total !== null &&
        rate?.total !== undefined,
    );

    const successfulCount = successfulRates.length;

    if (successfulCount === previousSuccessfulCount) {
      stablePolls += 1;
    } else {
      stablePolls = 0;
    }

    previousSuccessfulCount = successfulCount;

    console.log("Skydropx quotation poll:", {
      attempt,
      quotationId,
      isCompleted: quotationData?.is_completed,
      totalRates: rates.length,
      successfulRates: successfulCount,
      stablePolls,
    });

    if (quotationData?.is_completed === true) {
      return quotation;
    }

    if (
      attempt >= MIN_ATTEMPTS &&
      successfulCount > 0 &&
      stablePolls >= STABLE_POLLS_REQUIRED
    ) {
      return quotation;
    }

    await sleep(DELAY_MS);
  }

  if (lastQuotation) {
    const quotationData = lastQuotation?.data || lastQuotation;

    const rates = Array.isArray(quotationData?.rates)
      ? quotationData.rates
      : [];

    const successfulRates = rates.filter(
      (rate) =>
        rate?.success === true &&
        rate?.total !== null &&
        rate?.total !== undefined,
    );

    if (successfulRates.length > 0) {
      return lastQuotation;
    }
  }

  throw new Error("Skydropx no devolvió tarifas disponibles");
}

function buildParcel(items) {
  const standardItems = items.filter(
    (item) => item.shippingType === "standard",
  );

  if (standardItems.length === 0) {
    throw new Error("No hay productos estándar para cotizar automáticamente");
  }

  for (const item of standardItems) {
    if (item.readyForAutomaticQuote !== true) {
      throw new Error(
        `El producto ${item.slug} no tiene peso o dimensiones completas`,
      );
    }
  }

  const totalWeightGrams = standardItems.reduce(
    (total, item) => total + Number(item.weightGrams) * item.quantity,
    0,
  );

  const widthCm = Math.max(
    ...standardItems.map((item) => Number(item.widthCm)),
  );

  const heightCm = Math.max(
    ...standardItems.map((item) => Number(item.heightCm)),
  );

  const lengthCm = standardItems.reduce(
    (total, item) => total + Number(item.lengthCm) * item.quantity,
    0,
  );

  return {
    weightGrams: totalWeightGrams,
    widthCm,
    heightCm,
    lengthCm,
  };
}

function isValidFreeShippingCode(code) {
  const configuredCodes = String(process.env.FREE_SHIPPING_CODES || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const cleanCode = String(code || "")
    .trim()
    .toUpperCase();

  if (!cleanCode) {
    return false;
  }

  return configuredCodes.includes(cleanCode);
}

const ALLOWED_ORIGINS = [
  "https://www.melocotonmove.com",
  "http://localhost:3000",
];

function cors(event) {
  const origin = (event?.headers?.origin || "").toLowerCase();

  const allow =
    ALLOWED_ORIGINS.find(
      (allowedOrigin) => allowedOrigin.toLowerCase() === origin,
    ) || ALLOWED_ORIGINS[0];

  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-internal-key",
  };
}

function isAuthorizedInternalRequest(event) {
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    return false;
  }

  const receivedKey =
    event?.headers?.["x-internal-key"] || event?.headers?.["X-Internal-Key"];

  return receivedKey === expectedKey;
}

export const handler = async (event) => {
  const H = cors(event);

  try {
    const method = (
      event?.requestContext?.http?.method ||
      event?.httpMethod ||
      "GET"
    ).toUpperCase();

    const path = event?.rawPath || event?.path || "/";

    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: H,
        body: "",
      };
    }

    if (method === "GET" && path.startsWith("/api/shipping/postal-code/")) {
      const postalCode = path.replace("/api/shipping/postal-code/", "").trim();

      if (!/^\d{5}$/.test(postalCode)) {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Invalid postal code",
            message: "El código postal debe contener 5 dígitos.",
          }),
        };
      }

      const postalCodeData = await getPostalCodeData(postalCode);

      if (!postalCodeData) {
        return {
          statusCode: 404,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Postal code not found",
            message: "No encontramos ese código postal.",
          }),
        };
      }

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify({
          ok: true,
          ...postalCodeData,
        }),
      };
    }

    if (method === "POST" && path === "/api/shipping/quote") {
      let body;

      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Invalid JSON",
          }),
        };
      }

      const {
        items,
        postalCode,
        areaLevel1,
        areaLevel2,
        areaLevel3,
        promoCode,
      } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Cart must contain at least one item",
          }),
        };
      }

      const cleanPostalCode = String(postalCode || "").trim();

      if (!/^\d{5}$/.test(cleanPostalCode)) {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Invalid postal code",
          }),
        };
      }

      if (!areaLevel1 || !areaLevel2 || !areaLevel3) {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Missing destination area information",
          }),
        };
      }

      const shippingData = await getTrustedShippingProducts(items);

      if (shippingData.hasCustomShipping) {
        return {
          statusCode: 200,
          headers: H,
          body: JSON.stringify({
            ok: true,
            type: "custom",
            hasCustomShipping: true,
            message:
              "Este pedido contiene productos con envío especial que se cotizan por separado.",
            rates: [],
          }),
        };
      }

      const hasFreeShippingPromo = isValidFreeShippingCode(promoCode);

      if (hasFreeShippingPromo) {
        return {
          statusCode: 200,
          headers: H,
          body: JSON.stringify({
            ok: true,
            type: "free_shipping_promo",
            freeShipping: true,
            promoCodeApplied: true,
            rates: [],
            shippingAmount: 0,
            message: "Código de envío gratis aplicado.",
          }),
        };
      }

      if (shippingData.canQuoteAutomatically !== true) {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Missing shipping data",
            missingShippingData: shippingData.missingShippingData,
          }),
        };
      }

      const parcel = buildParcel(shippingData.items);

      const originPostalCode = process.env.SKYDROPX_ORIGIN_POSTAL_CODE;

      const originAreaLevel1 = process.env.SKYDROPX_ORIGIN_AREA_LEVEL1;

      const originAreaLevel2 = process.env.SKYDROPX_ORIGIN_AREA_LEVEL2;

      const originAreaLevel3 = process.env.SKYDROPX_ORIGIN_AREA_LEVEL3;

      if (
        !originPostalCode ||
        !originAreaLevel1 ||
        !originAreaLevel2 ||
        !originAreaLevel3
      ) {
        throw new Error("Falta configuración de dirección origen de Skydropx");
      }

      const quotationPayload = {
        quotation: {
          address_from: {
            country_code: "MX",
            postal_code: originPostalCode,
            area_level1: originAreaLevel1,
            area_level2: originAreaLevel2,
            area_level3: originAreaLevel3,
          },

          address_to: {
            country_code: "MX",
            postal_code: cleanPostalCode,
            area_level1: areaLevel1,
            area_level2: areaLevel2,
            area_level3: areaLevel3,
          },

          parcel: {
            length: parcel.lengthCm,
            width: parcel.widthCm,
            height: parcel.heightCm,
            distance_unit: "CM",
            weight: parcel.weightGrams / 1000,
            mass_unit: "KG",
          },
        },
      };

      const createdQuotation = await createQuotation(quotationPayload);

      const quotationId = createdQuotation?.id || createdQuotation?.data?.id;

      if (!quotationId) {
        console.error("Skydropx quotation without id:", createdQuotation);

        throw new Error("Skydropx no devolvió un quotation_id");
      }

      const completedQuotation = await waitForQuotation(quotationId);

      const quotationData = completedQuotation?.data || completedQuotation;

      const rates = Array.isArray(quotationData?.rates)
        ? quotationData.rates
        : [];

      const availableRates = rates
        .filter(
          (rate) =>
            rate?.success === true &&
            rate?.total !== null &&
            rate?.total !== undefined,
        )
        .map((rate) => ({
          id: rate.id,

          provider: rate.provider_name,
          providerDisplayName: rate.provider_display_name,

          serviceName: rate.provider_service_name,

          serviceCode: rate.provider_service_code,

          total: Number(rate.total),

          amount: rate.amount !== null ? Number(rate.amount) : null,

          serviceFee:
            rate.service_fee !== null ? Number(rate.service_fee) : null,

          days: rate.days !== null ? Number(rate.days) : null,

          currency: rate.currency_code || "MXN",

          pickup: rate.pickup === true,

          officeDelivery: rate.office_delivery === true,

          officeDeliveryOnly: rate.office_delivery_only === true,
        }))
        .filter(
          (rate) =>
            Number.isFinite(rate.total) &&
            rate.total >= 0 &&
            rate.officeDeliveryOnly !== true,
        )
        .sort((a, b) => a.total - b.total);

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify({
          ok: true,

          quotationId,

          freeShipping: shippingData.allStandardItemsFreeShipping,

          rates: availableRates,
        }),
      };
    }

    if (method === "POST" && path === "/internal/shipping/test-products") {
      if (!isAuthorizedInternalRequest(event)) {
        return {
          statusCode: 401,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Unauthorized",
          }),
        };
      }

      let body;

      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Invalid JSON",
          }),
        };
      }

      const { items } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Cart must contain at least one item",
          }),
        };
      }

      const shippingData = await getTrustedShippingProducts(items);

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify({
          ok: true,
          source: "ecommerce-api",
          ...shippingData,
        }),
      };
    }

    if (method === "GET" && path === "/internal/skydropx/addresses") {
      if (!isAuthorizedInternalRequest(event)) {
        return {
          statusCode: 401,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Unauthorized",
          }),
        };
      }

      const addresses = await getAddressTemplates();

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify({
          ok: true,
          addresses,
        }),
      };
    }

    if (method === "GET" && path === "/internal/skydropx/test") {
      if (!isAuthorizedInternalRequest(event)) {
        return {
          statusCode: 401,
          headers: H,
          body: JSON.stringify({
            ok: false,
            error: "Unauthorized",
          }),
        };
      }

      await getSkydropxToken();

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify({
          ok: true,
          authenticated: true,
          provider: "skydropx",
          message: "Autenticación con Skydropx correcta",
        }),
      };
    }

    return {
      statusCode: 404,
      headers: H,
      body: JSON.stringify({
        error: "Not found",
      }),
    };
  } catch (error) {
    console.error("Shipping API error:", error);

    return {
      statusCode: 500,
      headers: H,
      body: JSON.stringify({
        ok: false,
        error: "Server error",
        detail: error?.message,
      }),
    };
  }
};
