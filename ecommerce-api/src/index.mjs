import pg from "pg";

const { Pool } = pg;

const ALLOWED_ORIGINS = [
  "https://www.melocotonmove.com",
  "http://localhost:3000",
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
});

function cors(event) {
  const origin = (event?.headers?.origin || "").toLowerCase();

  const allow =
    ALLOWED_ORIGINS.find(
      (allowedOrigin) => allowedOrigin.toLowerCase() === origin,
    ) || ALLOWED_ORIGINS[0];

  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

function decimalToNumber(value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function cleanArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}

function rowToProduct(row) {
  const product = {
    name: row.name,
    slug: row.slug,
    image: row.image,

    gallery: cleanArray(row.gallery),

    fullPrice: decimalToNumber(row.fullPrice) ?? 0,
    colors: cleanArray(row.colors),

    category: row.category || "general",
    featured: row.featured === true,
    description: row.description || "",

    studioTypes: cleanArray(row.studioTypes),

    quoteRecommended: row.quoteRecommended === true,

    freeShipping: row.freeShipping === true,
    shippingType: row.shippingType === "custom" ? "custom" : "standard",

    materials: cleanArray(row.materials),
    care: cleanArray(row.care),
    highlights: cleanArray(row.highlights),
    whatsIncluded: cleanArray(row.whatsIncluded),

    tags: cleanArray(row.tags),
    related: cleanArray(row.related),
  };

  const discountPrice = decimalToNumber(row.discountPrice);

  if (discountPrice !== undefined) {
    product.discountPrice = discountPrice;
  }

  if (row.quoteQuantityType) {
    product.quoteQuantityType = row.quoteQuantityType;
  }

  if (row.quoteFixedQuantity !== null) {
    product.quoteFixedQuantity = row.quoteFixedQuantity;
  }

  if (row.quoteNote) {
    product.quoteNote = row.quoteNote;
  }

  if (row.stock !== null) {
    product.stock = row.stock;
  }

  if (row.maxQty !== null) {
    product.maxQty = row.maxQty;
  }

  const weightGrams = decimalToNumber(row.weightGrams);

  if (weightGrams !== undefined) {
    product.weightGrams = weightGrams;
  }

  const widthCm = decimalToNumber(row.widthCm);
  const heightCm = decimalToNumber(row.heightCm);
  const lengthCm = decimalToNumber(row.lengthCm);

  if (
    widthCm !== undefined &&
    heightCm !== undefined &&
    lengthCm !== undefined
  ) {
    product.dimensionsCm = {
      w: widthCm,
      h: heightCm,
      l: lengthCm,
    };
  }

  if (
    row.shippingMinBusinessDays !== null &&
    row.shippingMaxBusinessDays !== null
  ) {
    product.shippingEstimate = {
      minBusinessDays: row.shippingMinBusinessDays,
      maxBusinessDays: row.shippingMaxBusinessDays,
    };
  }

  if (row.brand) {
    product.brand = row.brand;
  }

  if (row.sku) {
    product.sku = row.sku;
  }

  if (row.returnDays !== null) {
    product.returnDays = row.returnDays;
  }

  if (row.warrantyMonths !== null) {
    product.warrantyMonths = row.warrantyMonths;
  }

  return product;
}

async function getProducts() {
  const result = await pool.query(`
    SELECT *
    FROM "Product"
    WHERE active = true
    ORDER BY "createdAt" ASC
  `);

  return result.rows.map(rowToProduct);
}

async function getProductBySlug(slug) {
  const result = await pool.query(
    `
      SELECT *
      FROM "Product"
      WHERE active = true
        AND slug = $1
      LIMIT 1
    `,
    [slug],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToProduct(result.rows[0]);
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

    const qs = event?.rawQueryString || "";

    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: H,
        body: "",
      };
    }

    if (method === "GET" && path === "/api/products") {
      const products = await getProducts();

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify(products),
      };
    }

    if (method === "GET" && path.startsWith("/api/products/")) {
      const slug = decodeURIComponent(path.replace("/api/products/", ""));

      const item = await getProductBySlug(slug);

      return item
        ? {
            statusCode: 200,
            headers: H,
            body: JSON.stringify(item),
          }
        : {
            statusCode: 404,
            headers: H,
            body: JSON.stringify({
              error: "Not found",
            }),
          };
    }

    if (method === "GET" && path === "/api/categories") {
      const result = await pool.query(`
        SELECT DISTINCT category
        FROM "Product"
        WHERE active = true
        ORDER BY category ASC
      `);

      const categories = result.rows.map((row) => row.category || "general");

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify(categories),
      };
    }

    if (method === "GET" && path === "/api/featured") {
      const result = await pool.query(`
        SELECT *
        FROM "Product"
        WHERE active = true
          AND featured = true
        ORDER BY "createdAt" ASC
      `);

      const products = result.rows.map(rowToProduct);

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify(products),
      };
    }

    if (method === "GET" && path === "/api/search") {
      const query =
        new URLSearchParams(qs).get("query")?.toLowerCase().trim() || "";

      if (!query) {
        return {
          statusCode: 200,
          headers: H,
          body: JSON.stringify([]),
        };
      }

      const products = await getProducts();

      const results = products.filter((product) => {
        const name = (product.name || "").toLowerCase();
        const description = (product.description || "").toLowerCase();

        const tags = Array.isArray(product.tags) ? product.tags : [];

        return (
          name.includes(query) ||
          description.includes(query) ||
          tags.some((tag) => (tag || "").toLowerCase().includes(query))
        );
      });

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify(results),
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
    console.error(error);

    return {
      statusCode: 500,
      headers: H,
      body: JSON.stringify({
        error: "Server error",
        detail: error?.message,
      }),
    };
  }
};
