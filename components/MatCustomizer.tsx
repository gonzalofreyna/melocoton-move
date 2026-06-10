// components/MatCustomizer.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Group,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import jsPDF from "jspdf";

type MatShape = "capsula" | "clasico" | "bala";
type MatFinish =
  | { type: "solid"; value: string; label: string }
  | { type: "texture"; value: string; label: string };
type MatPromotion = "fiveOffMsi" | "buy5Pay4";
type LogoItem = {
  id: string;
  src: string;
  x: number;
  y: number;
  widthPercent: number;
  rotation: number;
};

const MAT_REAL_WIDTH_CM = 70;
const MAT_REAL_HEIGHT_CM = 183;
const MAT_PRICE = 1499;
const WHATSAPP_PHONE = "523310125501";

const matShapes: { id: MatShape; label: string }[] = [
  { id: "capsula", label: "Cápsula" },
  { id: "clasico", label: "Clásico" },
  { id: "bala", label: "Bala" },
];

const solidColors = [
  "#3D3A3B",
  "#7A7A78",
  "#F7F7F7",
  "#FFD71E",
  "#F2DADD",
  "#DE765F",
  "#D46D78",
  "#B8AAA0",
  "#D5CEBC",
  "#285D48",
  "#24548F",
  "#ADB58B",
  "#9ABAB4",
  "#B08BBB",
  "#73A0BA",
  "#4C4D53",
  "#E62623",
  "#2F9A91",
  "#B3AFE6",
  "#A89EAD",
  "#66676D",
  "#8B604E",
  "#60456A",
  "#FFF0C3",
  "#AED0DB",
  "#F6D1A5",
  "#C97643",
  "#F3B5BE",
];
const textureFinishes: MatFinish[] = Array.from({ length: 15 }, (_, index) => ({
  type: "texture",
  value: `/images/mat_textures/${index + 1}.webp`,
  label: `Textura ${index + 1}`,
}));

function getMatRadius(shape: MatShape, width: number) {
  if (shape === "capsula") return width / 2;
  if (shape === "clasico") return 10;
  return [width / 2, width / 2, 8, 8];
}

function LogoImage({
  logo,
  matWidth,
  selected,
  onSelect,
  onChange,
}: {
  logo: LogoItem;
  matWidth: number;
  selected: boolean;
  onSelect: () => void;
  onChange: (logo: LogoItem) => void;
}) {
  const [image] = useImage(logo.src);
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const logoWidth = (matWidth * logo.widthPercent) / 100;
  const ratio = image ? image.height / image.width : 1;
  const logoHeight = logoWidth * ratio;

  useMemo(() => {
    if (selected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={logo.x}
        y={logo.y}
        width={logoWidth}
        height={logoHeight}
        rotation={logo.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...logo,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();

          node.scaleX(1);
          node.scaleY(1);

          const newWidth = Math.max(20, node.width() * scaleX);
          const newPercent = Math.round((newWidth / matWidth) * 100);

          onChange({
            ...logo,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            widthPercent: Math.min(100, Math.max(5, newPercent)),
          });
        }}
      />

      {selected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          keepRatio
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
        />
      )}
    </>
  );
}
function MatTexture({
  src,
  shape,
  matWidth,
  matHeight,
}: {
  src: string;
  shape: MatShape;
  matWidth: number;
  matHeight: number;
}) {
  const [image] = useImage(src);

  const drawClip = (ctx: any) => {
    const radius = matWidth / 2;

    ctx.beginPath();

    if (shape === "capsula") {
      ctx.moveTo(radius, 0);
      ctx.lineTo(matWidth - radius, 0);
      ctx.quadraticCurveTo(matWidth, 0, matWidth, radius);
      ctx.lineTo(matWidth, matHeight - radius);
      ctx.quadraticCurveTo(matWidth, matHeight, matWidth - radius, matHeight);
      ctx.lineTo(radius, matHeight);
      ctx.quadraticCurveTo(0, matHeight, 0, matHeight - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
    }

    if (shape === "clasico") {
      const r = 10;
      ctx.moveTo(r, 0);
      ctx.lineTo(matWidth - r, 0);
      ctx.quadraticCurveTo(matWidth, 0, matWidth, r);
      ctx.lineTo(matWidth, matHeight - r);
      ctx.quadraticCurveTo(matWidth, matHeight, matWidth - r, matHeight);
      ctx.lineTo(r, matHeight);
      ctx.quadraticCurveTo(0, matHeight, 0, matHeight - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
    }

    if (shape === "bala") {
      ctx.moveTo(radius, 0);
      ctx.lineTo(matWidth - radius, 0);
      ctx.quadraticCurveTo(matWidth, 0, matWidth, radius);
      ctx.lineTo(matWidth, matHeight - 8);
      ctx.quadraticCurveTo(matWidth, matHeight, matWidth - 8, matHeight);
      ctx.lineTo(8, matHeight);
      ctx.quadraticCurveTo(0, matHeight, 0, matHeight - 8);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
    }

    ctx.closePath();
  };

  return (
    <Group clipFunc={drawClip}>
      <Rect width={matWidth} height={matHeight} fill="#ffffff" />

      {image && (
        <KonvaImage image={image} width={matWidth} height={matHeight} />
      )}
    </Group>
  );
}
export default function MatCustomizer() {
  const stageRef = useRef<any>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);

  const [shape, setShape] = useState<MatShape>("capsula");
  const [finish, setFinish] = useState<MatFinish>({
    type: "solid",
    value: "#3D3A3B",
    label: "Negro carbón",
  });
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promotion, setPromotion] = useState<MatPromotion>("fiveOffMsi");

  const [previewWidth, setPreviewWidth] = useState(420);

  useEffect(() => {
    const updatePreviewWidth = () => {
      if (!previewWrapRef.current) return;

      const availableWidth = previewWrapRef.current.clientWidth;
      setPreviewWidth(Math.min(420, Math.max(280, availableWidth)));
    };

    updatePreviewWidth();

    window.addEventListener("resize", updatePreviewWidth);

    return () => {
      window.removeEventListener("resize", updatePreviewWidth);
    };
  }, []);

  const stageWidth = previewWidth;
  const stageHeight = Math.round(stageWidth * 1.72);

  const matHeight = Math.round(stageHeight * 0.86);
  const matWidth = Math.round(
    matHeight * (MAT_REAL_WIDTH_CM / MAT_REAL_HEIGHT_CM),
  );

  const matX = (stageWidth - matWidth) / 2;
  const matY = Math.round(stageHeight * 0.06);

  const selectedLogo = logos.find((logo) => logo.id === selectedLogoId);
  const safeQuantity = Math.min(99, Math.max(1, Math.floor(quantity || 1)));

  const paidQuantity =
    promotion === "buy5Pay4"
      ? safeQuantity - Math.floor(safeQuantity / 5)
      : safeQuantity;

  const subtotalBeforePromo = MAT_PRICE * safeQuantity;

  const estimatedTotal =
    promotion === "fiveOffMsi"
      ? subtotalBeforePromo * 0.95
      : MAT_PRICE * paidQuantity;

  const savings = subtotalBeforePromo - estimatedTotal;

  const promoLabel =
    promotion === "fiveOffMsi"
      ? "5% OFF + MSI"
      : `5x4: pagas ${paidQuantity} de ${safeQuantity}`;

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const updateMatQuantity = (value: number) => {
    const cleanValue = Math.min(
      99,
      Math.max(1, Math.floor(Number(value) || 1)),
    );
    setQuantity(cleanValue);
  };

  const handleLogoUpload = (files: FileList | null) => {
    if (!files?.length) return;

    setUploadMessage(
      files.length === 1
        ? `Archivo cargado con éxito: ${files[0].name}`
        : `${files.length} archivos cargados con éxito`,
    );

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const newLogo: LogoItem = {
          id: crypto.randomUUID(),
          src: String(reader.result),
          x: matX + matWidth * 0.375,
          y: matY + matHeight * 0.4,
          widthPercent: 25,
          rotation: 0,
        };

        setLogos((prev) => [...prev, newLogo]);
        setSelectedLogoId(newLogo.id);
      };

      reader.readAsDataURL(file);
    });
  };

  const updateLogo = (updatedLogo: LogoItem) => {
    setLogos((prev) =>
      prev.map((logo) => (logo.id === updatedLogo.id ? updatedLogo : logo)),
    );
  };

  const downloadPNG = () => {
    setSelectedLogoId(null);

    requestAnimationFrame(() => {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      link.download = "mi-mat-personalizado.png";
      link.href = dataURL;
      link.click();
    });
  };

  const downloadPDF = () => {
    setSelectedLogoId(null);

    requestAnimationFrame(() => {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 3,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.setFontSize(16);
      pdf.text("Diseño de mat personalizado", 15, 18);

      pdf.setFontSize(10);
      pdf.text(`Forma: ${shape}`, 15, 26);
      pdf.text(`Acabado: ${finish.label}`, 15, 32);
      pdf.text(
        `Medidas reales: ${MAT_REAL_HEIGHT_CM} cm x ${MAT_REAL_WIDTH_CM} cm`,
        15,
        38,
      );

      pdf.addImage(dataURL, "PNG", 45, 48, 120, 190);
      pdf.save("mi-mat-personalizado.pdf");
    });
  };
  const handleWhatsAppOrder = () => {
    if (!stageRef.current) return;

    setSelectedLogoId(null);

    requestAnimationFrame(() => {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 3,
        mimeType: "image/png",
      });

      const link = document.createElement("a");
      link.download = "mi-mat-personalizado.png";
      link.href = dataURL;
      link.click();

      const message = [
        "Hola, quiero comprar un mat personalizado.",
        "",
        `Forma: ${shape}`,
        `Acabado: ${finish.label}`,
        `Medidas: ${MAT_REAL_HEIGHT_CM} cm x ${MAT_REAL_WIDTH_CM} cm`,
        `Cantidad: ${safeQuantity}`,
        `Precio unitario: ${formatMoney(MAT_PRICE)}`,
        `Promoción elegida: ${promoLabel}`,
        `Subtotal sin promoción: ${formatMoney(subtotalBeforePromo)}`,
        `Ahorro estimado: ${formatMoney(savings)}`,
        `Total estimado: ${formatMoney(estimatedTotal)}`,
        "",
        "Ya descargué la imagen de mi diseño y la adjunto aquí.",
      ].join("\n");

      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
        message,
      )}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    });
  };

  const removeSelectedLogo = () => {
    if (!selectedLogoId) return;
    setLogos((prev) => prev.filter((logo) => logo.id !== selectedLogoId));
    setSelectedLogoId(null);
  };

  return (
    <section className="min-h-screen bg-[#fbf7f2] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-gray-500">
            Personaliza tu práctica
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
            Crea tu propio mat
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Elige forma, color y coloca tu logo exactamente donde lo quieres.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_520px]">
          <div className="contents lg:block lg:rounded-[2rem] lg:bg-white lg:p-8 lg:shadow-sm">
            <div className="order-1 rounded-[2rem] bg-white p-5 shadow-sm md:p-8 lg:p-0 lg:shadow-none">
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  1. Elige la forma
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  {matShapes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setShape(item.id)}
                      className={`rounded-2xl border p-4 transition ${
                        shape === item.id
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                      }`}
                      type="button"
                    >
                      <div
                        className="mx-auto mb-3 h-24 w-14 bg-current"
                        style={{
                          borderRadius:
                            item.id === "capsula"
                              ? "999px"
                              : item.id === "bala"
                                ? "999px 999px 8px 8px"
                                : "8px",
                        }}
                      />
                      <span className="text-sm font-bold uppercase">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  2. Elige color o textura
                </h2>

                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                    Colores sólidos
                  </h3>

                  <div className="grid grid-cols-7 gap-3 sm:grid-cols-10">
                    {solidColors.map((item) => (
                      <button
                        key={item}
                        onClick={() =>
                          setFinish({
                            type: "solid",
                            value: item,
                            label: item,
                          })
                        }
                        className={`h-10 rounded-xl border transition ${
                          finish.type === "solid" && finish.value === item
                            ? "scale-110 border-gray-900 ring-2 ring-gray-900"
                            : "border-gray-200"
                        }`}
                        style={{ backgroundColor: item }}
                        type="button"
                        aria-label={`Elegir color ${item}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                    Texturas premium
                  </h3>

                  <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
                    {textureFinishes.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setFinish(item)}
                        className={`h-16 overflow-hidden rounded-xl border transition ${
                          finish.type === "texture" &&
                          finish.value === item.value
                            ? "scale-105 border-gray-900 ring-2 ring-gray-900"
                            : "border-gray-200"
                        }`}
                        type="button"
                        aria-label={`Elegir ${item.label}`}
                      >
                        <img
                          src={item.value}
                          alt={item.label}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  3. Sube tu logo o diseño
                </h2>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-gray-500">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    multiple
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files)}
                  />

                  <span className="text-base font-semibold text-gray-900">
                    Subir logo o diseño
                  </span>

                  <span className="mt-1 text-sm text-gray-500">
                    PNG, JPG, WEBP o SVG. Puedes subir más de una imagen.
                  </span>

                  <span className="mt-4 max-w-md rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-gray-600 shadow-sm">
                    Para mejor resultado, sube tu logo en{" "}
                    <strong className="font-semibold text-gray-900">
                      PNG con fondo transparente
                    </strong>{" "}
                    o{" "}
                    <strong className="font-semibold text-gray-900">SVG</strong>
                    . Si tu imagen tiene fondo blanco, se verá sobre el mat.
                  </span>
                </label>

                {uploadMessage && (
                  <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {uploadMessage}
                  </div>
                )}

                {selectedLogo && (
                  <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-5">
                    <h3 className="mb-4 font-semibold text-gray-900">
                      Ajustar logo seleccionado
                    </h3>

                    <label className="mb-4 block">
                      <span className="mb-2 block text-sm text-gray-600">
                        Tamaño del logo: {selectedLogo.widthPercent}% del ancho
                        del mat
                      </span>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={selectedLogo.widthPercent}
                        onChange={(e) =>
                          updateLogo({
                            ...selectedLogo,
                            widthPercent: Number(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </label>

                    <label className="mb-4 block">
                      <span className="mb-2 block text-sm text-gray-600">
                        Rotación: {Math.round(selectedLogo.rotation)}°
                      </span>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedLogo.rotation}
                        onChange={(e) =>
                          updateLogo({
                            ...selectedLogo,
                            rotation: Number(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </label>

                    <button
                      onClick={removeSelectedLogo}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      type="button"
                    >
                      Eliminar logo
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="order-3 mb-8 rounded-3xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                4. Cantidad y cotización
              </h2>

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Precio por mat</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMoney(MAT_PRICE)}
                  </p>
                </div>

                <div className="flex items-center overflow-hidden rounded-2xl border border-gray-300 bg-white">
                  <button
                    type="button"
                    onClick={() => updateMatQuantity(safeQuantity - 1)}
                    className="h-11 w-11 text-xl font-bold text-gray-700 hover:bg-gray-100"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={safeQuantity}
                    onChange={(e) => updateMatQuantity(Number(e.target.value))}
                    className="h-11 w-16 border-x border-gray-200 text-center font-semibold outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => updateMatQuantity(safeQuantity + 1)}
                    className="h-11 w-11 text-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                    aria-label="Aumentar cantidad"
                    disabled={safeQuantity >= 99}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    promotion === "fiveOffMsi"
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="matPromotion"
                    value="fiveOffMsi"
                    checked={promotion === "fiveOffMsi"}
                    onChange={() => setPromotion("fiveOffMsi")}
                    className="sr-only"
                  />

                  <span className="block text-sm font-bold">5% OFF + MSI</span>
                  <span className="mt-1 block text-xs opacity-80">
                    Se descuenta 5% sobre el total.
                  </span>
                </label>

                <label
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    promotion === "buy5Pay4"
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="matPromotion"
                    value="buy5Pay4"
                    checked={promotion === "buy5Pay4"}
                    onChange={() => setPromotion("buy5Pay4")}
                    className="sr-only"
                  />

                  <span className="block text-sm font-bold">5x4</span>
                  <span className="mt-1 block text-xs opacity-80">
                    Por cada 5 mats, pagas solo 4.
                  </span>
                </label>
              </div>

              <div className="rounded-2xl bg-[#fbf7f2] p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Cantidad</span>
                  <span>{safeQuantity}</span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>Promoción</span>
                  <span>{promoLabel}</span>
                </div>

                {promotion === "buy5Pay4" && (
                  <div className="mt-2 flex justify-between text-sm text-gray-600">
                    <span>Mats a pagar</span>
                    <span>{paidQuantity}</span>
                  </div>
                )}

                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>Subtotal sin promoción</span>
                  <span>{formatMoney(subtotalBeforePromo)}</span>
                </div>

                {savings > 0 && (
                  <div className="mt-2 flex justify-between text-sm font-medium text-green-700">
                    <span>Ahorro estimado</span>
                    <span>-{formatMoney(savings)}</span>
                  </div>
                )}

                <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
                  <span>Total estimado</span>
                  <span>{formatMoney(estimatedTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="mt-4 w-full rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-700"
              >
                Solicitar y comprar
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                Al continuar, se descargará la imagen de tu diseño y se abrirá
                WhatsApp con tu cotización. Adjunta la imagen descargada en el
                chat.
              </p>
            </div>
          </div>

          <div className="order-2 w-full min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="w-full rounded-[2rem] bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Vista previa
                  </h2>
                  <p className="text-sm text-gray-500">
                    Mat real: 183 cm x 70 cm
                  </p>
                </div>

                <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                  {shape}
                </div>
              </div>

              <div
                ref={previewWrapRef}
                className="flex w-full justify-center overflow-hidden rounded-[1.5rem] bg-[#f6f1ea]"
              >
                <div
                  style={{
                    width: stageWidth,
                    height: stageHeight,
                  }}
                >
                  <Stage
                    ref={stageRef}
                    width={stageWidth}
                    height={stageHeight}
                    onMouseDown={(e) => {
                      const clickedEmpty = e.target === e.target.getStage();
                      if (clickedEmpty) setSelectedLogoId(null);
                    }}
                    onTouchStart={(e) => {
                      const clickedEmpty = e.target === e.target.getStage();
                      if (clickedEmpty) setSelectedLogoId(null);
                    }}
                    className="mx-auto block"
                  >
                    <Layer>
                      <Group
                        x={matX}
                        y={matY}
                        shadowColor="black"
                        shadowBlur={20}
                        shadowOpacity={0.12}
                        shadowOffsetY={12}
                      >
                        {finish.type === "solid" ? (
                          <Rect
                            width={matWidth}
                            height={matHeight}
                            fill={finish.value}
                            cornerRadius={getMatRadius(shape, matWidth)}
                          />
                        ) : (
                          <MatTexture
                            src={finish.value}
                            shape={shape}
                            matWidth={matWidth}
                            matHeight={matHeight}
                          />
                        )}
                      </Group>

                      {logos.map((logo) => (
                        <LogoImage
                          key={logo.id}
                          logo={logo}
                          matWidth={matWidth}
                          selected={logo.id === selectedLogoId}
                          onSelect={() => setSelectedLogoId(logo.id)}
                          onChange={updateLogo}
                        />
                      ))}
                    </Layer>
                  </Stage>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={downloadPNG}
                  className="rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-700"
                  type="button"
                >
                  Descargar imagen
                </button>

                <button
                  onClick={downloadPDF}
                  className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-50"
                  type="button"
                >
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
