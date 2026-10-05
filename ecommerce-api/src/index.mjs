import pg from "pg";
import { randomUUID } from "node:crypto";

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

function isAuthorizedInternalRequest(event) {
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    console.error("❌ Falta INTERNAL_API_KEY en la Lambda");
    return false;
  }

  const receivedKey =
    event?.headers?.["x-internal-key"] || event?.headers?.["X-Internal-Key"];

  return receivedKey === expectedKey;
}

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

    if (method === "POST" && path === "/internal/shipping/products") {
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

      const quantitiesBySlug = new Map();

      for (const item of items) {
        const slug = typeof item?.slug === "string" ? item.slug.trim() : "";

        const quantity = Number(item?.quantity);

        if (!slug || !Number.isInteger(quantity) || quantity <= 0) {
          return {
            statusCode: 400,
            headers: H,
            body: JSON.stringify({
              ok: false,
              error: "Invalid cart item",
            }),
          };
        }

        quantitiesBySlug.set(
          slug,
          (quantitiesBySlug.get(slug) || 0) + quantity,
        );
      }

      const slugs = [...quantitiesBySlug.keys()];

      const productResult = await pool.query(
        `
      SELECT
        slug,
        name,
        active,
        stock,
        "maxQty",
        "freeShipping",
        "shippingType",
        "weightGrams",
        "widthCm",
        "heightCm",
        "lengthCm"
      FROM "Product"
      WHERE slug = ANY($1::text[])
    `,
        [slugs],
      );

      const productsBySlug = new Map(
        productResult.rows.map((row) => [row.slug, row]),
      );

      const trustedItems = [];

      for (const slug of slugs) {
        const product = productsBySlug.get(slug);
        const quantity = quantitiesBySlug.get(slug);

        if (!product) {
          return {
            statusCode: 400,
            headers: H,
            body: JSON.stringify({
              ok: false,
              error: "Product not found",
              slug,
            }),
          };
        }

        if (product.active !== true) {
          return {
            statusCode: 400,
            headers: H,
            body: JSON.stringify({
              ok: false,
              error: "Product is inactive",
              slug,
            }),
          };
        }

        const maxQty = product.maxQty === null ? 10 : product.maxQty;

        if (quantity > maxQty) {
          return {
            statusCode: 400,
            headers: H,
            body: JSON.stringify({
              ok: false,
              error: "Quantity exceeds maxQty",
              slug,
              requestedQuantity: quantity,
              maxQty,
            }),
          };
        }

        if (
          product.stock !== null &&
          Number.isInteger(product.stock) &&
          quantity > product.stock
        ) {
          return {
            statusCode: 400,
            headers: H,
            body: JSON.stringify({
              ok: false,
              error: "Insufficient stock",
              slug,
              requestedQuantity: quantity,
              availableStock: product.stock,
            }),
          };
        }

        const weightGrams = decimalToNumber(product.weightGrams);
        const widthCm = decimalToNumber(product.widthCm);
        const heightCm = decimalToNumber(product.heightCm);
        const lengthCm = decimalToNumber(product.lengthCm);

        const isCustom = product.shippingType === "custom";

        const missingShippingData = isCustom
          ? []
          : [
              weightGrams === undefined ? "weightGrams" : null,
              widthCm === undefined ? "widthCm" : null,
              heightCm === undefined ? "heightCm" : null,
              lengthCm === undefined ? "lengthCm" : null,
            ].filter(Boolean);

        trustedItems.push({
          slug: product.slug,
          name: product.name,
          quantity,
          freeShipping: product.freeShipping === true,
          shippingType: isCustom ? "custom" : "standard",
          weightGrams: weightGrams ?? null,
          widthCm: widthCm ?? null,
          heightCm: heightCm ?? null,
          lengthCm: lengthCm ?? null,
          readyForAutomaticQuote: isCustom || missingShippingData.length === 0,
          missingShippingData,
        });
      }

      const hasCustomShipping = trustedItems.some(
        (item) => item.shippingType === "custom",
      );

      const standardItems = trustedItems.filter(
        (item) => item.shippingType === "standard",
      );

      const allStandardItemsFreeShipping =
        standardItems.length > 0 &&
        standardItems.every((item) => item.freeShipping === true);

      const missingShippingData = trustedItems
        .filter(
          (item) =>
            item.shippingType === "standard" &&
            item.readyForAutomaticQuote !== true,
        )
        .map((item) => ({
          slug: item.slug,
          fields: item.missingShippingData,
        }));

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify({
          ok: true,
          items: trustedItems,
          hasCustomShipping,
          allStandardItemsFreeShipping,
          canQuoteAutomatically: missingShippingData.length === 0,
          missingShippingData,
        }),
      };
    }

    if (method === "POST" && path === "/internal/orders/complete") {
      if (!isAuthorizedInternalRequest(event)) {
        return {
          statusCode: 401,
          headers: H,
          body: JSON.stringify({
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
            error: "Invalid JSON",
          }),
        };
      }

      const {
        stripeSessionId,
        paymentIntentId,
        customerEmail,
        customerName,
        currency,
        subtotal,
        shippingAmount,
        discountAmount,
        total,
        shippingName,
        shippingAddress,
        shippingPostalCode,
        shippingCity,
        shippingState,
        shippingCountry,
        hasCustomShipping,
        shippingLabel,
        items,
      } = body;

      if (!stripeSessionId || typeof stripeSessionId !== "string") {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            error: "Missing stripeSessionId",
          }),
        };
      }

      if (!Array.isArray(items) || items.length === 0) {
        return {
          statusCode: 400,
          headers: H,
          body: JSON.stringify({
            error: "Order must contain at least one item",
          }),
        };
      }

      for (const item of items) {
        if (
          !item ||
          typeof item.slug !== "string" ||
          !item.slug ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
        ) {
          return {
            statusCode: 400,
            headers: H,
            body: JSON.stringify({
              error: "Invalid order item",
            }),
          };
        }
      }

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
          stripeSessionId,
        ]);

        const existingOrder = await client.query(
          `
      SELECT id, status
      FROM "Order"
      WHERE "stripeSessionId" = $1
      LIMIT 1
    `,
          [stripeSessionId],
        );

        if (existingOrder.rows.length > 0) {
          await client.query("COMMIT");

          return {
            statusCode: 200,
            headers: H,
            body: JSON.stringify({
              ok: true,
              alreadyProcessed: true,
              orderId: existingOrder.rows[0].id,
              status: existingOrder.rows[0].status,
            }),
          };
        }

        const quantitiesBySlug = new Map();

        for (const item of items) {
          const slug = item.slug.trim();
          const currentQuantity = quantitiesBySlug.get(slug) || 0;

          quantitiesBySlug.set(slug, currentQuantity + item.quantity);
        }

        const lockedProducts = [];

        for (const [slug, quantity] of quantitiesBySlug.entries()) {
          const productResult = await client.query(
            `
     SELECT
  id,
  slug,
  sku,
  name,
  image,
  "fullPrice",
  "discountPrice",
  stock,
  "maxQty",
  active
FROM "Product"
WHERE slug = $1
FOR UPDATE
    `,
            [slug],
          );

          if (productResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return {
              statusCode: 400,
              headers: H,
              body: JSON.stringify({
                error: "Product not found",
                slug,
              }),
            };
          }

          const product = productResult.rows[0];

          if (product.active !== true) {
            await client.query("ROLLBACK");

            return {
              statusCode: 400,
              headers: H,
              body: JSON.stringify({
                error: "Product is inactive",
                slug,
              }),
            };
          }

          const maxQty = product.maxQty === null ? 10 : product.maxQty;

          if (quantity > maxQty) {
            await client.query("ROLLBACK");

            return {
              statusCode: 400,
              headers: H,
              body: JSON.stringify({
                error: "Quantity exceeds maxQty",
                slug,
                requestedQuantity: quantity,
                maxQty,
              }),
            };
          }

          if (
            product.stock !== null &&
            Number.isInteger(product.stock) &&
            quantity > product.stock
          ) {
            await client.query("ROLLBACK");

            return {
              statusCode: 400,
              headers: H,
              body: JSON.stringify({
                error: "Insufficient stock",
                slug,
                requestedQuantity: quantity,
                availableStock: product.stock,
              }),
            };
          }

          lockedProducts.push({
            ...product,
            quantity,
          });
        }

        const orderSubtotal = Number(subtotal);
        const orderShippingAmount = Number(shippingAmount);
        const orderDiscountAmount = Number(discountAmount);
        const orderTotal = Number(total);

        if (
          !Number.isFinite(orderSubtotal) ||
          !Number.isFinite(orderShippingAmount) ||
          !Number.isFinite(orderDiscountAmount) ||
          !Number.isFinite(orderTotal) ||
          orderSubtotal < 0 ||
          orderShippingAmount < 0 ||
          orderDiscountAmount < 0 ||
          orderTotal < 0
        ) {
          await client.query("ROLLBACK");

          return {
            statusCode: 400,
            headers: H,
            body: JSON.stringify({
              error: "Invalid order amounts",
            }),
          };
        }

        const orderId = randomUUID();

        const insertedOrder = await client.query(
          `
    INSERT INTO "Order" (
      id,
      "stripeSessionId",
      "paymentIntentId",
      "customerEmail",
      "customerName",
      status,
      currency,
      subtotal,
      "shippingAmount",
      "discountAmount",
      total,
      "shippingName",
      "shippingAddress",
      "shippingPostalCode",
      "shippingCity",
      "shippingState",
      "shippingCountry",
      "hasCustomShipping",
      "shippingLabel",
      "paidAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      $1, $2, $3, $4, $5,
      'paid',
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16,
      $17, $18,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT ("stripeSessionId") DO NOTHING
    RETURNING id, status
  `,
          [
            orderId,
            stripeSessionId,
            paymentIntentId || null,
            customerEmail || null,
            customerName || null,
            typeof currency === "string" && currency
              ? currency.toLowerCase()
              : "mxn",
            orderSubtotal,
            orderShippingAmount,
            orderDiscountAmount,
            orderTotal,
            shippingName || null,
            shippingAddress || null,
            shippingPostalCode || null,
            shippingCity || null,
            shippingState || null,
            shippingCountry || null,
            hasCustomShipping === true,
            shippingLabel || null,
          ],
        );

        if (insertedOrder.rows.length === 0) {
          const duplicatedOrder = await client.query(
            `
      SELECT id, status
      FROM "Order"
      WHERE "stripeSessionId" = $1
      LIMIT 1
    `,
            [stripeSessionId],
          );

          await client.query("COMMIT");

          return {
            statusCode: 200,
            headers: H,
            body: JSON.stringify({
              ok: true,
              alreadyProcessed: true,
              orderId: duplicatedOrder.rows[0]?.id,
              status: duplicatedOrder.rows[0]?.status,
            }),
          };
        }

        for (const product of lockedProducts) {
          const fullPrice = Number(product.fullPrice);

          const discountPrice =
            product.discountPrice !== null
              ? Number(product.discountPrice)
              : null;

          const unitPrice =
            discountPrice !== null &&
            Number.isFinite(discountPrice) &&
            discountPrice > 0
              ? discountPrice
              : fullPrice;

          if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error(`Precio inválido para producto ${product.slug}`);
          }

          const itemSubtotal = unitPrice * product.quantity;

          await client.query(
            `
      INSERT INTO "OrderItem" (
        id,
        "orderId",
        "productId",
        slug,
        sku,
        name,
        quantity,
        "unitPrice",
        subtotal,
        image,
        "createdAt"
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        NOW()
      )
    `,
            [
              randomUUID(),
              insertedOrder.rows[0].id,
              product.id,
              product.slug,
              product.sku || null,
              product.name,
              product.quantity,
              unitPrice,
              itemSubtotal,
              product.image || null,
            ],
          );
        }

        for (const product of lockedProducts) {
          if (product.stock === null) {
            continue;
          }

          const updatedStock = await client.query(
            `
      UPDATE "Product"
      SET
        stock = stock - $1,
        "updatedAt" = NOW()
      WHERE id = $2
        AND stock IS NOT NULL
        AND stock >= $1
      RETURNING stock
    `,
            [product.quantity, product.id],
          );

          if (updatedStock.rows.length === 0) {
            throw new Error(`No se pudo descontar stock de ${product.slug}`);
          }

          await client.query(
            `
      INSERT INTO "InventoryMovement" (
        id,
        "productId",
        "orderId",
        type,
        quantity,
        note,
        "createdAt"
      )
      VALUES (
        $1,
        $2,
        $3,
        'sale',
        $4,
        $5,
        NOW()
      )
    `,
            [
              randomUUID(),
              product.id,
              insertedOrder.rows[0].id,
              -product.quantity,
              `Venta Stripe ${stripeSessionId}`,
            ],
          );
        }

        await client.query("COMMIT");

        return {
          statusCode: 200,
          headers: H,
          body: JSON.stringify({
            ok: true,
            alreadyProcessed: false,
            orderId: insertedOrder.rows[0].id,
            status: insertedOrder.rows[0].status,
            itemCount: items.length,
            message: "Order created",
          }),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
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
