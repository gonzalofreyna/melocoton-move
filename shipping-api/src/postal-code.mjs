import { readFile } from "node:fs/promises";

let postalCodesCache = null;

async function loadPostalCodes() {
  if (postalCodesCache) {
    return postalCodesCache;
  }

  const fileUrl = new URL("./postal-codes.json", import.meta.url);

  const raw = await readFile(fileUrl, "utf8");
  const data = JSON.parse(raw);

  postalCodesCache = data;

  return data;
}

export async function getPostalCodeData(postalCode) {
  const cleanPostalCode = String(postalCode || "").trim();

  if (!/^\d{5}$/.test(cleanPostalCode)) {
    return null;
  }

  const postalCodes = await loadPostalCodes();

  const result = postalCodes[cleanPostalCode];

  if (!result) {
    return null;
  }

  return {
    postalCode: cleanPostalCode,
    areaLevel1: result.areaLevel1,
    areaLevel2: result.areaLevel2,
    colonies: Array.isArray(result.colonies)
      ? result.colonies
      : [],
  };
}
