import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";

const prisma = new PrismaClient();

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function nullableInteger(value) {
  const number = nullableNumber(value);

  if (number === null) {
    return null;
  }

  return Math.trunc(number);
}

function stringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}

function productData(product) {
  return {
    name: String(product.name || ""),
    slug: String(product.slug || ""),
    image: String(product.image || ""),

    gallery: stringArray(product.gallery),

    fullPrice: Number(product.fullPrice || 0),
    discountPrice: nullableNumber(product.discountPrice),

    colors: stringArray(product.colors),

    category: String(product.category || "general"),
    featured: product.featured === true,
    description: String(product.description || ""),

    studioTypes: stringArray(product.studioTypes),

    quoteQuantityType: product.quoteQuantityType || null,
    quoteFixedQuantity: nullableInteger(product.quoteFixedQuantity),
    quoteNote: typeof product.quoteNote === "string" ? product.quoteNote : null,
    quoteRecommended: product.quoteRecommended === true,

    freeShipping: product.freeShipping === true,
    shippingType: product.shippingType === "custom" ? "custom" : "standard",

    stock: nullableInteger(product.stock),
    maxQty: nullableInteger(product.maxQty),
    weightGrams: nullableNumber(product.weightGrams),

    widthCm: nullableNumber(product.dimensionsCm?.w),
    heightCm: nullableNumber(product.dimensionsCm?.h),
    lengthCm: nullableNumber(product.dimensionsCm?.l),

    shippingMinBusinessDays: nullableInteger(
      product.shippingEstimate?.minBusinessDays,
    ),

    shippingMaxBusinessDays: nullableInteger(
      product.shippingEstimate?.maxBusinessDays,
    ),

    brand: typeof product.brand === "string" ? product.brand : null,

    sku:
      typeof product.sku === "string" && product.sku.trim()
        ? product.sku
        : null,

    materials: stringArray(product.materials),
    care: stringArray(product.care),
    highlights: stringArray(product.highlights),
    whatsIncluded: stringArray(product.whatsIncluded),

    returnDays: nullableInteger(product.returnDays),
    warrantyMonths: nullableInteger(product.warrantyMonths),

    tags: stringArray(product.tags),
    related: stringArray(product.related),

    active: true,
  };
}

async function main() {
  const fileUrl = new URL("./products.json", import.meta.url);

  const raw = await readFile(fileUrl, "utf8");
  const products = JSON.parse(raw);

  if (!Array.isArray(products)) {
    throw new Error("products.json debe contener un arreglo de productos");
  }

  console.log(`Productos encontrados en JSON: ${products.length}`);

  let created = 0;
  let updated = 0;

  for (const product of products) {
    if (!product.slug) {
      throw new Error(
        `Producto sin slug: ${product.name || "Producto desconocido"}`,
      );
    }

    const existing = await prisma.product.findUnique({
      where: {
        slug: product.slug,
      },
      select: {
        id: true,
      },
    });

    const data = productData(product);

    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      create: data,
      update: data,
    });

    if (existing) {
      updated += 1;
      console.log(`♻️ Actualizado: ${product.slug}`);
    } else {
      created += 1;
      console.log(`✅ Creado: ${product.slug}`);
    }
  }

  const total = await prisma.product.count();

  console.log("");
  console.log("Importación terminada");
  console.log(`Creados: ${created}`);
  console.log(`Actualizados: ${updated}`);
  console.log(`Total en PostgreSQL: ${total}`);
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Error importando productos:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
