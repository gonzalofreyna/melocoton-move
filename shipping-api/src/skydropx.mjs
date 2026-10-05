const SKYDROPX_BASE_URL = "https://api-pro.skydropx.com";

const SKYDROPX_API_KEY = process.env.SKYDROPX_API_KEY;
const SKYDROPX_API_SECRET = process.env.SKYDROPX_API_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

function ensureCredentials() {
  if (!SKYDROPX_API_KEY || !SKYDROPX_API_SECRET) {
    throw new Error(
      "Faltan SKYDROPX_API_KEY o SKYDROPX_API_SECRET en variables de entorno",
    );
  }
}

export async function getSkydropxToken() {
  ensureCredentials();

  const now = Date.now();

  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  const res = await fetch(`${SKYDROPX_BASE_URL}/api/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: SKYDROPX_API_KEY,
      client_secret: SKYDROPX_API_SECRET,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.access_token) {
    console.error("Skydropx auth error:", {
      status: res.status,
      data,
    });

    throw new Error(
      data?.message ||
        data?.error_description ||
        "No se pudo autenticar con Skydropx",
    );
  }

  cachedToken = data.access_token;

  const expiresInSeconds = Number(data.expires_in || 7200);

  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;

  return cachedToken;
}

async function skydropxRequest(path, options = {}) {
  const token = await getSkydropxToken();

  const res = await fetch(`${SKYDROPX_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Skydropx API error:", {
      path,
      status: res.status,
      data,
    });

    throw new Error(
      JSON.stringify({
        status: res.status,
        message:
          data?.message || data?.error || `Error Skydropx HTTP ${res.status}`,
        details: data,
      }),
    );
  }

  return data;
}

export async function createQuotation(payload) {
  return skydropxRequest("/api/v1/quotations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getQuotation(quotationId) {
  if (!quotationId) {
    throw new Error("Falta quotationId");
  }

  return skydropxRequest(
    `/api/v1/quotations/${encodeURIComponent(quotationId)}`,
    {
      method: "GET",
    },
  );
}

export async function createShipment(payload) {
  return skydropxRequest("/api/v1/shipments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getShipment(shipmentId) {
  if (!shipmentId) {
    throw new Error("Falta shipmentId");
  }

  return skydropxRequest(
    `/api/v1/shipments/${encodeURIComponent(shipmentId)}`,
    {
      method: "GET",
    },
  );
}

export async function getAddressTemplates(page = 1) {
  return skydropxRequest(
    `/api/v1/address_templates?page=${encodeURIComponent(page)}`,
    {
      method: "GET",
    },
  );
}
