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
  Text as KonvaText,
} from "react-konva";
import useImage from "use-image";
import jsPDF from "jspdf";

type MatShape = "capsula" | "clasico" | "bala";
type MatFinish =
  | { type: "solid"; value: string; label: string }
  | { type: "texture"; value: string; label: string };
type TextPosition = "superior" | "superior-izquierda" | "superior-derecha" | "centro" | "centro-izquierda" | "centro-derecha" | "inferior" | "inferior-izquierda" | "inferior-derecha" | "libre";
const TEXT_PRESETS: { value: TextPosition; label: string; x: number; y: number }[] = [
  { value: "superior-izquierda", label: "Arriba izq.", x: 5, y: 18 },
  { value: "superior", label: "Arriba centro", x: 50, y: 18 },
  { value: "superior-derecha", label: "Arriba der.", x: 95, y: 18 },
  { value: "centro-izquierda", label: "Centro izq.", x: 5, y: 50 },
  { value: "centro", label: "Centro", x: 50, y: 50 },
  { value: "centro-derecha", label: "Centro der.", x: 95, y: 50 },
  { value: "inferior-izquierda", label: "Abajo izq.", x: 5, y: 82 },
  { value: "inferior", label: "Abajo centro", x: 50, y: 82 },
  { value: "inferior-derecha", label: "Abajo der.", x: 95, y: 82 },
];
type EngravingItem = { id: string; text: string; font: "elegante" | "moderna" | "manuscrita"; position: TextPosition; sizeCm: number; rotation: number; x: number; y: number };
type LogoItem = {
  id: string;
  src: string;
  x: number;
  y: number;
  widthPercent: number;
  rotation: number;
};

const MAT_DIMENSIONS: Record<MatShape, { height: number; width: number }> = {
  clasico: { height: 182, width: 69 },
  bala: { height: 182, width: 69 },
  capsula: { height: 181, width: 68 },
};
const MAT_THICKNESS_MM = 5;
const MAT_PRICE = 1399;
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
  "#741D32", // Vino marrón / guinda
  "#60456A",
  "#FFF0C3",
  "#AED0DB",
  "#F6D1A5",
  "#C97643",
  "#F3B5BE",
];
const solidColorNames: Record<string, string> = {
  "#3D3A3B": "Negro carbón",
  "#7A7A78": "Gris piedra",
  "#F7F7F7": "Blanco nieve",
  "#FFD71E": "Amarillo sol",
  "#F2DADD": "Rosa empolvado",
  "#DE765F": "Terracota",
  "#D46D78": "Rosa antiguo",
  "#B8AAA0": "Arena cálida",
  "#D5CEBC": "Marfil",
  "#285D48": "Verde bosque",
  "#24548F": "Azul profundo",
  "#ADB58B": "Verde salvia",
  "#9ABAB4": "Verde agua",
  "#B08BBB": "Lavanda",
  "#73A0BA": "Azul cielo",
  "#4C4D53": "Grafito",
  "#E62623": "Rojo intenso",
  "#2F9A91": "Turquesa",
  "#B3AFE6": "Lila pastel",
  "#A89EAD": "Malva grisáceo",
  "#66676D": "Gris humo",
  "#8B604E": "Café cacao",
  "#741D32": "Vino",
  "#60456A": "Ciruela",
  "#FFF0C3": "Vainilla",
  "#AED0DB": "Azul bruma",
  "#F6D1A5": "Durazno",
  "#C97643": "Canela",
  "#F3B5BE": "Rosa suave",
};
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
  tintColor,
  selected,
  onSelect,
  onChange,
}: {
  logo: LogoItem;
  matWidth: number;
  tintColor: string | null;
  selected: boolean;
  onSelect: () => void;
  onChange: (logo: LogoItem) => void;
}) {
  const [image] = useImage(logo.src);
  const tintedImage = useMemo(() => {
    if (!image || !tintColor || typeof document === "undefined") return image;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx || !canvas.width || !canvas.height) return image;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = tintColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return canvas;
    } catch { return image; }
  }, [image, tintColor]);
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const logoWidth = (matWidth * logo.widthPercent) / 100;
  const ratio = image ? image.height / image.width : 1;
  const logoHeight = logoWidth * ratio;
  const snapRotation = (degrees: number) => ((Math.round(degrees / 45) * 45) % 360 + 360) % 360;

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
        image={tintedImage}
        x={logo.x + logoWidth / 2}
        y={logo.y + logoHeight / 2}
        offsetX={logoWidth / 2}
        offsetY={logoHeight / 2}
        width={logoWidth}
        height={logoHeight}
        rotation={logo.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...logo,
            x: e.target.x() - logoWidth / 2,
            y: e.target.y() - logoHeight / 2,
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();

          node.scaleX(1);
          node.scaleY(1);

          const newWidth = Math.max(20, node.width() * scaleX);
          const newPercent = Math.round((newWidth / matWidth) * 100);
          const boundedWidth = matWidth * Math.min(100, Math.max(5, newPercent)) / 100;
          const boundedHeight = boundedWidth * ratio;

          onChange({
            ...logo,
            x: node.x() - boundedWidth / 2,
            y: node.y() - boundedHeight / 2,
            rotation: snapRotation(node.rotation()),
            widthPercent: Math.min(100, Math.max(5, newPercent)),
          });
        }}
      />

      {selected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={23}
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
// Elimina únicamente el fondo casi blanco conectado con el exterior.
// Conserva el interior del logo, sus trazos blancos aislados y la transparencia original.
// Limpia fondos claros uniformes y conectados a los bordes, incluidos blancos cálidos.
// No sustituye la revisión vectorial previa al grabado.
function removePlainWhiteBackground(source: string): Promise<string> {
  return new Promise(resolve => {
    const image = new window.Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d", {willReadFrequently:true});
        if (!ctx) {resolve(source);return;}
        ctx.drawImage(image,0,0,width,height);
        const pixels=ctx.getImageData(0,0,width,height);
        const data=pixels.data,total=width*height;
        const corners=[0,width-1,(height-1)*width,(height*width)-1];
        const cornerColors=corners.map(i=>[data[4*i],data[4*i+1],data[4*i+2],data[4*i+3]]);
        const candidates=cornerColors.filter(c=>c[3]>=240 && Math.min(c[0],c[1],c[2])>=198 &&
          Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2])<42);
        if(candidates.length<3){resolve(source);return;}
        const bg=[0,1,2].map(c=>candidates.reduce((sum,v)=>sum+v[c],0)/candidates.length);
        const distance=(i:number)=>{
          const p=i*4;
          return Math.sqrt((data[p]-bg[0])**2+(data[p+1]-bg[1])**2+(data[p+2]-bg[2])**2);
        };
        // El fondo debe dominar el marco para no borrar accidentalmente un logo claro.
        let edges=0,similar=0;
        const count=(i:number)=>{if(data[i*4+3]>=200){edges++;if(distance(i)<52)similar++;}};
        for(let x=0;x<width;x++){count(x);count((height-1)*width+x);}
        for(let y=1;y<height-1;y++){count(y*width);count(y*width+width-1);}
        if(!edges || similar/edges<0.72){resolve(source);return;}
        const visited=new Uint8Array(total),queue=new Int32Array(total);
        let head=0,tail=0;
        const add=(i:number)=>{
          if(!visited[i] && data[i*4+3]>0 && distance(i)<65){visited[i]=1;queue[tail++]=i;}
        };
        for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
        for(let y=1;y<height-1;y++){add(y*width);add(y*width+width-1);}
        while(head<tail){
          const i=queue[head++],x=i%width,y=Math.floor(i/width);
          if(x>0)add(i-1);if(x+1<width)add(i+1);
          if(y>0)add(i-width);if(y+1<height)add(i+width);
        }
        if(tail<total*0.015 || tail>total*0.96){resolve(source);return;}
        for(let j=0;j<tail;j++){
          const i=queue[j],p=i*4,d=distance(i);
          // Suaviza bordes claros de JPG para evitar halos rectangulares.
          const alpha=d<=28?0:Math.round(255*Math.min(1,(d-28)/37));
          data[p+3]=Math.min(data[p+3],alpha);
        }
        ctx.putImageData(pixels,0,0);
        resolve(canvas.toDataURL("image/png"));
      }catch{resolve(source);}
    };
    image.onerror=()=>resolve(source);
    image.src=source;
  });
}

export default function MatCustomizer() {
  const stageRef = useRef<any>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);

  const [shape, setShape] = useState<MatShape>("bala");
  const [finish, setFinish] = useState<MatFinish>({
    type: "solid",
    value: "#741D32",
    label: "Vino",
  });
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [engravings, setEngravings] = useState<EngravingItem[]>([{id:"initial",text:"",font:"elegante",position:"centro",sizeCm:6,rotation:0,x:50,y:50}]);
  const [selectedTextId, setSelectedTextId] = useState("initial");
  const selectedText = engravings.find(e => e.id === selectedTextId);
  const updateText = (id: string, patch: Partial<EngravingItem>) => setEngravings(items => items.map(item => item.id === id ? {...item,...patch} : item));
  const addText = () => {
    const id = crypto.randomUUID();
    setEngravings(items => [...items,{id,text:"",font:"elegante",position:"centro",sizeCm:6,rotation:0,x:50,y:50}]);
    setSelectedTextId(id);
  };
  const removeText = (id: string) => {
    setEngravings(items => items.filter(item => item.id !== id));
    if (selectedTextId === id) setSelectedTextId("");
  };
  const [personalizeMode, setPersonalizeMode] = useState<"text" | "logo">("text");
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [finishPickerOpen, setFinishPickerOpen] = useState(false);
  const [finishCategory, setFinishCategory] = useState<"solid" | "texture">("solid");
  const [mobileStep, setMobileStep] = useState<"quantity" | "shape" | "color" | "design" | "preview" | "checkout">("quantity");
  const [quoteRequested, setQuoteRequested] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [promotionMode, setPromotionMode] = useState<"single10" | "msi15" | "volume20">("single10");

  const [previewWidth, setPreviewWidth] = useState(420);

  useEffect(() => {
    const updatePreviewWidth = () => {
      if (!previewWrapRef.current) return;

      const availableWidth = previewWrapRef.current.clientWidth;
      setPreviewWidth(Math.min(window.innerWidth < 640 ? 300 : 420, Math.max(160, availableWidth)));
    };

    updatePreviewWidth();

    window.addEventListener("resize", updatePreviewWidth);

    return () => {
      window.removeEventListener("resize", updatePreviewWidth);
    };
  }, [mobileStep]);

  const matDimensions = MAT_DIMENSIONS[shape];
  const stageWidth = previewWidth;
  const stageHeight = Math.round(stageWidth * 1.72);

  const matHeight = Math.round(stageHeight * 0.86);
  const matWidth = Math.round(
    matHeight * (matDimensions.width / matDimensions.height),
  );

  const matX = (stageWidth - matWidth) / 2;
  const engravingFonts = { elegante: "Georgia", moderna: "Arial", manuscrita: "cursive" };
  const engravingColor = finish.type === "solid" && /^#[0-9a-f]{6}$/i.test(finish.value)
    ? "#" + [1, 3, 5].map((i) => Math.max(0, Math.round(parseInt(finish.value.slice(i, i + 2), 16) * 0.4)).toString(16).padStart(2, "0")).join("")
    : "#554b46";
  const matY = Math.round(stageHeight * 0.06);
  const engravingGeometry = (item: EngravingItem) => {
    const requestedPx = item.sizeCm * matHeight / matDimensions.height;
    const estimatedCharsWidth = [...item.text.trim()].reduce((sum,ch) => sum + (ch === " " ? .32 : .58), 0);
    const actualFontSize = Math.min(requestedPx, matWidth * .90 / Math.max(1, estimatedCharsWidth));
    const width = Math.min(matWidth * .90, Math.max(actualFontSize, estimatedCharsWidth * actualFontSize));
    const height = Math.max(8, actualFontSize * 1.35);
    const left = (matWidth - width) * item.x / 100;
    const top = (matHeight - height) * item.y / 100;
    return {width,height,left,top,fontSize:actualFontSize,xCm:Number((left/matWidth*matDimensions.width).toFixed(1)),
      yCm:Number((top/matHeight*matDimensions.height).toFixed(1)),
      effectiveSizeCm:Number((actualFontSize/matHeight*matDimensions.height).toFixed(1))};
  };

  const selectedLogo = logos.find((logo) => logo.id === selectedLogoId);
  const safeQuantity = Math.min(99, Math.max(1, Math.floor(quantity || 1)));

  const subtotalBeforePromo = MAT_PRICE * safeQuantity;
  const discountRate = safeQuantity < 5 ? 0.10 : promotionMode === "msi15" ? 0.15 : 0.20;
  const discountedUnitPrice = Math.round(MAT_PRICE * (1 - discountRate) * 100) / 100;
  const estimatedTotal = Math.round(discountedUnitPrice * safeQuantity * 100) / 100;
  const savings = subtotalBeforePromo - estimatedTotal;
  const promoLabel = safeQuantity < 5 ? "10% de descuento · pago de contado (sin MSI)" : promotionMode === "msi15" ? "15% de descuento + 3 MSI (sujeto a elegibilidad de Stripe)" : "20% de descuento · pago de contado (sin MSI)";

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const handleBuyNow = async () => {
    if (checkoutLoading) return;
    setCheckoutError(null);

    // This is the public base URL of the separately deployed API, never a secret.
    const configuredApiUrl = process.env.NEXT_PUBLIC_PERSONALIZED_MAT_API_URL;
    if (!configuredApiUrl) {
      setCheckoutError("La compra directa todavía no está disponible. Puedes consultar por WhatsApp.");
      return;
    }
    let checkoutEndpoint: URL;
    try {
      const base = new URL(configuredApiUrl);
      if (base.search || base.hash || base.username || base.password ||
          !(base.protocol === "https:" || (base.protocol === "http:" && base.hostname === "localhost"))) {
        throw new Error("URL de API inválida");
      }
      checkoutEndpoint = new URL(base.href.replace(/\/$/, "") + "/checkout");
    } catch {
      setCheckoutError("La compra directa no está configurada correctamente.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch(checkoutEndpoint.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: safeQuantity, promotion: safeQuantity < 5 ? "single10" : promotionMode }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(typeof data?.message === "string" ? data.message : "No se pudo iniciar el pago.");
      }
      const destination = new URL(data.url);
      if (destination.protocol !== "https:" || !(
        destination.hostname === "checkout.stripe.com" ||
        destination.hostname.endsWith(".checkout.stripe.com")
      )) {
        throw new Error("La respuesta de pago no es válida.");
      }
      // Diseño temporal por sesión de Stripe; no se persiste en la base de datos.
      // La confirmación solo podrá abrirse en este mismo navegador.
      const sessionId = destination.pathname.match(/cs_(?:live|test)_[A-Za-z0-9]+/)?.[0];
      if (sessionId) {
        try {
          sessionStorage.setItem("melocoton_design_" + sessionId, JSON.stringify({
            texts: engravings.filter(t => t.text.trim()).map(t => ({
              text:t.text.trim(),font:t.font,position:t.position,sizeCm:t.sizeCm,rotation:t.rotation,
              xCm:engravingGeometry(t).xCm,
              yCm:engravingGeometry(t).yCm,
              effectiveSizeCm:engravingGeometry(t).effectiveSizeCm,
            })),
            shape, finish: finish.label, quantity: safeQuantity,
            logoCount: logos.length,
          }));
        } catch (error) {
          console.warn("No se pudo conservar el diseño temporalmente", error);
        }
      }
      window.location.assign(destination.toString());
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "No se pudo conectar con el pago.");
      setCheckoutLoading(false);
    }
  };

  const updateMatQuantity = (value: number) => {
    const cleanValue = Math.min(
      99,
      Math.max(1, Math.floor(Number(value) || 1)),
    );
    setQuantity(cleanValue);
    setQuoteRequested(false);
    setPromotionMode(cleanValue >= 5 ? "msi15" : "single10");
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

      reader.onload = async () => {
        const original = String(reader.result);
        let src = original;

        const traceUrl = process.env.NEXT_PUBLIC_LOGO_TRACE_API_URL;
        if (file.type !== "image/svg+xml") {
          if (!traceUrl) {
            setUploadMessage("El procesador de logos todavía no está conectado. Puedes continuar tu compra y enviarnos el logo por WhatsApp.");
            return;
          }
          try {
            setUploadMessage("Trazando tu logo…");
            const response = await fetch(traceUrl, {
              method: "POST",
              headers: { "Content-Type": file.type || "application/octet-stream" },
              body: file,
            });
            if (!response.ok) throw new Error(`Lambda respondió ${response.status}`);
            const traced = await response.json() as { previewPng?: string };
            if (!traced.previewPng || !traced.previewPng.startsWith("iVBOR")) throw new Error("No se recibió un PNG válido");
            src = "data:image/png;base64," + traced.previewPng;
          } catch (error) {
            console.warn("No se pudo obtener el trazado desde AWS:", error);
            setUploadMessage("No pudimos procesar tu logo ahora. No lo añadimos para evitar que aparezca como un cuadro sólido. Puedes continuar tu compra y enviarnos el archivo por WhatsApp.");
            return;
          }
        }
        const newLogo: LogoItem = {
          id: crypto.randomUUID(),
          src,
          x: matX + matWidth * 0.375,
          y: matY + matHeight * 0.4,
          widthPercent: 25,
          rotation: 0,
        };
        setLogos((prev) => [...prev, newLogo]);
        setSelectedLogoId(newLogo.id);
        if (file.type === "image/svg+xml" || src !== original) setUploadMessage(file.type === "image/svg+xml" ? "Logo SVG cargado" : "Logo trazado automáticamente");
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
        `Medidas: ${matDimensions.height} × ${matDimensions.width} cm · ${MAT_THICKNESS_MM} mm de espesor`,
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
        "Hola, quiero comprar un tapete personalizado.",
        ...engravings.filter(t => t.text.trim()).map((t,i) => `Texto ${i+1}: "${t.text.trim()}" · ${t.font} · ${t.position} · alto aprox. ${engravingGeometry(t).effectiveSizeCm} cm · giro ${t.rotation}° · X ${engravingGeometry(t).xCm} cm, Y ${engravingGeometry(t).yCm} cm`),
        "",
        `Forma: ${shape}`,
        `Acabado: ${finish.label}`,
        `Medidas: ${matDimensions.height} × ${matDimensions.width} cm · ${MAT_THICKNESS_MM} mm de espesor`,
        `Cantidad: ${safeQuantity}`,
        `Precio unitario: ${formatMoney(MAT_PRICE)}`,
        `Promoción elegida: ${promoLabel}`,
        `Modalidad de pago: ${promotionMode === "msi15" ? "3 MSI sujetos a elegibilidad" : "Sin MSI"}`,
        `Subtotal sin promoción: ${formatMoney(subtotalBeforePromo)}`,
        `Ahorro estimado: ${formatMoney(savings)}`,
        `Total estimado: ${formatMoney(estimatedTotal)}`,
        "",
        "Entrega estimada: 45 días hábiles.",
        "Envío: se cotiza y cobra por separado; no está incluido en el total estimado.",
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
    const remaining = logos.filter((logo) => logo.id !== selectedLogoId);
    setLogos(remaining);
    // Si quedan logos, mantener seleccionado uno para mostrar tamaño y rotación.
    setSelectedLogoId(remaining.length ? remaining[remaining.length - 1].id : null);
  };

  return (
    <section aria-label="Personalizador de tapetes" className="bg-white px-3 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-3 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_520px]">
          <nav aria-label="Pasos del personalizador" className="order-1 rounded-2xl bg-brand-sand p-3 lg:hidden">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-brand-ink">Paso {["quantity","shape","color","design","preview","checkout"].indexOf(mobileStep) + 1} de 6</p>
              <p className="text-xs font-semibold text-brand-ink">Tu tapete, a tu manera</p>
            </div>
            <div className="grid grid-cols-6 gap-1" aria-hidden="true">
              {(["quantity","shape","color","design","preview","checkout"] as const).map((step,index) => (
                <span key={step} className={`h-1.5 rounded-full ${["quantity","shape","color","design","preview","checkout"].indexOf(mobileStep) >= index ? "bg-brand-wine" : "bg-gray-300"}`} />
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-brand-ink">
              {{quantity:"¿Cuántos tapetes necesitas?",shape:"Elige la forma",color:"Elige el color",design:"Hazlo tuyo: nombre o logo",preview:"Así quedó tu tapete",checkout:"Revisa y paga"}[mobileStep]}
            </p>
            {mobileStep === "preview" && <button type="button" onClick={downloadPNG} className="mt-3 min-h-11 w-full rounded-xl border border-brand-wine bg-white px-3 text-sm font-semibold text-brand-wine">Descargar mi diseño PNG</button>}
            {mobileStep === "preview" && <button type="button" onClick={() => { setMobileStep("checkout"); document.getElementById("mat-checkout")?.scrollIntoView({behavior:"smooth",block:"start"}); }}
              className="mm-button mt-3 w-full py-3 text-sm font-semibold">Ir a cantidad y pago ↓</button>}
            {mobileStep !== "quantity" && <button type="button" onClick={() => {
              const previous: Record<string, "quantity" | "shape" | "color" | "design" | "preview"> = {shape:"quantity",color:"shape",design:"color",preview:"design",checkout:"preview"};
              setMobileStep(previous[mobileStep]);
            }} className="mt-2 min-h-10 text-sm font-semibold text-brand-wine">← Atrás</button>}
          </nav>
          <div className={`order-2 rounded-2xl border border-brand-line bg-white p-5 shadow-editorial lg:hidden ${mobileStep === "quantity" ? "" : "hidden"}`}>
            <h2 className="text-lg font-semibold text-brand-ink">Primero, ¿cuántos tapetes te gustaría personalizar?</h2>
            <p className="mt-2 text-sm text-gray-600">Elige una cantidad para conocer el precio y tu promoción.</p>
            <div className="mt-5 flex items-center justify-center gap-4">
              <button type="button" onClick={() => updateMatQuantity(safeQuantity - 1)}
                disabled={safeQuantity <= 1} aria-label="Quitar un tapete"
                className="h-12 w-12 rounded-xl border border-gray-300 text-2xl disabled:opacity-40">−</button>
              <input type="number" min={1} max={99} value={safeQuantity}
                onChange={e => updateMatQuantity(Number(e.target.value))}
                aria-label="Cantidad de tapetes"
                className="h-12 w-20 rounded-xl border border-gray-300 text-center text-xl font-bold" />
              <button type="button" onClick={() => updateMatQuantity(safeQuantity + 1)}
                disabled={safeQuantity >= 99} aria-label="Agregar un tapete"
                className="h-12 w-12 rounded-xl border border-gray-300 text-2xl disabled:opacity-40">+</button>
            </div>
            {!quoteRequested ? (
              <button type="button" onClick={() => setQuoteRequested(true)}
                className="mm-button mt-5 w-full py-3">Ver mi cotización →</button>
            ) : (
              <div className="mt-5" aria-live="polite">
                <div className="rounded-xl bg-brand-sand p-4">
                  <p className="text-xs text-gray-700">Tu cotización estimada · sin envío</p>
                  <p className="mt-1 text-2xl font-bold text-brand-ink">{formatMoney(estimatedTotal)}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-ink">
                    {safeQuantity < 5 ? "10% de descuento aplicado" : promotionMode === "volume20" ? "20% de descuento por pago de contado" : "15% de descuento + opción de 3 MSI"}
                  </p>
                  {savings > 0 && <p className="mt-1 text-sm text-green-700">Ahorras {formatMoney(savings)}</p>}
                  <p className="mt-2 text-xs text-gray-600">Las promociones pueden cambiarse antes de pagar. Los meses sin intereses dependen de la tarjeta.</p>
                </div>
                <button type="button" onClick={() => setMobileStep("shape")}
                  className="mm-button mt-4 w-full py-3">Comenzar a personalizar →</button>
              </div>
            )}
          </div>
          <div className="contents lg:order-1 lg:block lg:rounded-[2rem] lg:border lg:border-brand-line lg:bg-white lg:p-8 lg:shadow-editorial">
            <div className="contents lg:block lg:rounded-[2rem] lg:border-0 lg:p-0 lg:shadow-none">
              <div className={`order-3 rounded-2xl border border-brand-line bg-white p-4 shadow-editorial sm:rounded-[2rem] sm:p-5 md:p-8 lg:border-0 lg:p-0 lg:shadow-none lg:mb-6 ${mobileStep === "shape" ? "" : "hidden lg:block"}`}>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Elige la forma
                </h2>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {matShapes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setShape(item.id)}
                      className={`min-w-0 rounded-xl border p-2 transition sm:rounded-2xl sm:p-4 ${
                        shape === item.id
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                      }`}
                      type="button"
                    >
                      <div
                        className="mx-auto mb-2 h-12 w-8 bg-current sm:mb-3 sm:h-24 sm:w-14"
                        style={{
                          borderRadius:
                            item.id === "capsula"
                              ? "999px"
                              : item.id === "bala"
                                ? "999px 999px 8px 8px"
                                : "8px",
                        }}
                      />
                      <span className="text-[11px] font-bold uppercase sm:text-sm">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => {setMobileStep("color");setFinishPickerOpen(true);}} className="mm-button mt-5 w-full py-3 lg:hidden">Elegir color →</button>
              </div>

              <div className={`order-3 rounded-2xl border border-brand-line bg-white p-4 shadow-editorial sm:rounded-[2rem] sm:p-5 md:p-8 lg:border-0 lg:p-0 lg:shadow-none lg:mb-5 ${mobileStep === "color" ? "" : "hidden lg:block"}`}>
                <h2 className="mb-2 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                  Elige color o textura
                </h2>
                <button
                  type="button"
                  aria-expanded={finishPickerOpen}
                  aria-controls="mat-finish-options"
                  onClick={() => setFinishPickerOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-brand-line bg-brand-sand px-3 py-2 text-left"
                >
                  {finish.type === "solid" ? (
                    <span className="h-7 w-7 shrink-0 rounded-full border border-gray-300" style={{ backgroundColor: finish.value }} />
                  ) : (
                    <img src={finish.value} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-gray-500">Acabado seleccionado</span>
                    <span className="block truncate text-sm font-semibold text-gray-900">{finish.label}</span>
                  </span>
                  <span aria-hidden="true" className="text-sm font-semibold text-gray-700">{finishPickerOpen ? "Cerrar −" : "Cambiar +"}</span>
                </button>
                {finishPickerOpen && (
                  <div id="mat-finish-options" className="mt-2 rounded-xl border border-gray-200 p-2.5 sm:p-3">
                    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-brand-sand p-1 lg:hidden" role="group" aria-label="Tipo de acabado">
                      <button type="button" aria-pressed={finishCategory === "solid"} onClick={() => setFinishCategory("solid")} className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition ${finishCategory === "solid" ? "bg-white text-brand-ink shadow-sm" : "text-gray-600"}`}>Colores sólidos</button>
                      <button type="button" aria-pressed={finishCategory === "texture"} onClick={() => setFinishCategory("texture")} className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition ${finishCategory === "texture" ? "bg-white text-brand-ink shadow-sm" : "text-gray-600"}`}>Texturas premium</button>
                    </div>
                    <div className={finishCategory === "solid" ? "" : "hidden lg:block"}>
                    <h3 className="mb-2 hidden text-xs font-bold uppercase tracking-wide text-gray-500 lg:block">Colores sólidos</h3>
                    <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 sm:gap-2">
                      {solidColors.map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            setFinish({ type: "solid", value: item, label: solidColorNames[item] ?? item });
                          }}
                          className={`mx-auto h-8 w-8 rounded-full border transition sm:h-10 sm:w-10 ${
                            finish.type === "solid" && finish.value === item
                              ? "border-gray-900 ring-2 ring-gray-900"
                              : "border-gray-200"
                          }`}
                          style={{ backgroundColor: item }}
                          type="button"
                          aria-label={`Elegir color ${solidColorNames[item] ?? item}`}
                          aria-pressed={finish.type === "solid" && finish.value === item}
                        />
                      ))}
                    </div>
                    </div>
                    <div className={finishCategory === "texture" ? "" : "hidden lg:block"}>
                    <h3 className="mb-2 mt-2 hidden text-xs font-bold uppercase tracking-wide text-gray-500 lg:block lg:mt-5">Texturas premium</h3>
                    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 sm:gap-2">
                      {textureFinishes.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => {
                            setFinish(item);
                          }}
                          className={`h-11 overflow-hidden rounded-lg border transition sm:h-14 sm:rounded-xl ${
                            finish.type === "texture" && finish.value === item.value
                              ? "border-gray-900 ring-2 ring-gray-900"
                              : "border-gray-200"
                          }`}
                          type="button"
                          aria-label={`Elegir ${item.label}`}
                          aria-pressed={finish.type === "texture" && finish.value === item.value}
                        >
                          <img src={item.value} alt={item.label} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    </div>
                  </div>
                )}
                <p aria-live="polite" className="mt-2 text-xs text-gray-600">
                  {finish.type === "solid" ? "Color aplicado a la vista previa." : "Textura aplicada a la vista previa."}
                </p>
                <button type="button" onClick={() => setMobileStep("design")} className="mm-button mt-5 w-full py-3 lg:hidden">Hazlo tuyo →</button>
              </div>

              <div className={`order-3 rounded-2xl border border-brand-line bg-white p-4 shadow-editorial sm:rounded-[2rem] sm:p-5 md:p-8 lg:border-0 lg:p-0 lg:shadow-none lg:mb-4 ${mobileStep === "design" ? "" : "hidden lg:block"}`}>
                <h2 className="mb-2 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                  Hazlo tuyo: nombre o logo
                </h2>
                <div className="lg:hidden">
                  <p className="mb-3 text-sm text-gray-600">Elige cómo quieres personalizarlo. Puedes usar las dos opciones.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" aria-pressed={personalizeMode === "text"} onClick={() => setPersonalizeMode("text")}
                      className={`min-h-12 rounded-xl border px-2 text-sm font-semibold ${personalizeMode === "text" ? "border-brand-wine bg-brand-sand" : "border-gray-200"}`}>Escribir nombre</button>
                    <button type="button" aria-pressed={personalizeMode === "logo"} onClick={() => setPersonalizeMode("logo")}
                      className={`min-h-12 rounded-xl border px-2 text-sm font-semibold ${personalizeMode === "logo" ? "border-brand-wine bg-brand-sand" : "border-gray-200"}`}>Subir logo</button>
                  </div>
                  {personalizeMode === "text" ? (
                    <div className="mt-4 space-y-3">
                      {engravings.map((item, index) => (
                        <div key={item.id} className="rounded-xl border border-brand-line p-3">
                          <div className="flex items-center justify-between gap-2">
                            <label htmlFor={`mat-text-${item.id}`} className="text-sm font-semibold">Nombre o frase {engravings.length > 1 ? index + 1 : ""}</label>
                            {(item.text || engravings.length > 1) && <button type="button" onClick={() => removeText(item.id)} className="min-h-10 text-xs font-semibold text-red-700">Eliminar</button>}
                          </div>
                          <input id={`mat-text-${item.id}`} type="text" maxLength={120} value={item.text}
                            onFocus={() => setSelectedTextId(item.id)} onChange={e => updateText(item.id, {text:e.target.value})}
                            placeholder="Ej. Ana Victoria" className="mt-1 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-base" />
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <label className="text-xs font-semibold">Estilo de letra
                              <select value={item.font} onChange={e=>updateText(item.id,{font:e.target.value as EngravingItem["font"]})}
                                className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                                <option value="elegante">Elegante</option><option value="moderna">Moderna</option><option value="manuscrita">Manuscrita</option>
                              </select>
                            </label>
                            <label className="text-xs font-semibold">Ubicación
                              <select value={["superior","centro","inferior"].includes(item.position) ? item.position : "centro"}
                                onChange={e=>{const p=TEXT_PRESETS.find(p=>p.value===e.target.value);if(p)updateText(item.id,{position:p.value,x:p.x,y:p.y});}}
                                className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                                <option value="superior">Arriba</option><option value="centro">Centro</option><option value="inferior">Abajo</option>
                              </select>
                            </label>
                          </div>
                          <details className="mt-3 text-sm text-gray-600">
                            <summary className="cursor-pointer py-2 font-medium">Ajustar tamaño (opcional)</summary>
                            <label className="mt-2 block text-xs">Tamaño de letra
                              <input type="range" min="0.5" max="6" step="0.1" value={item.sizeCm}
                                onChange={e=>updateText(item.id,{sizeCm:Number(e.target.value)})} className="mt-2 w-full accent-brand-wine"/>
                            </label>
                          </details>
                        </div>
                      ))}
                      <button type="button" onClick={addText} className="min-h-11 w-full rounded-xl border border-brand-wine text-sm font-semibold text-brand-wine">+ Añadir otro texto</button>
                      <button type="button" onClick={()=>setPersonalizeMode("logo")} className="min-h-11 w-full text-sm font-medium text-brand-wine">También quiero agregar mi logo →</button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-wine bg-brand-sand/40 p-4 text-center">
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple className="sr-only" onChange={e=>handleLogoUpload(e.target.files)} />
                        <span className="font-semibold">Seleccionar mi logo</span>
                        <span className="mt-1 text-xs text-gray-600">PNG, JPG, WEBP o SVG</span>
                      </label>
                      {uploadMessage && <p role="status" className="text-sm text-green-700">{uploadMessage}</p>}
                      {logos.length > 0 && <p className="text-sm font-semibold text-gray-700">{logos.length} {logos.length === 1 ? "archivo cargado" : "archivos cargados"} ✓</p>}
                      <button type="button" onClick={()=>setPersonalizeMode("text")} className="min-h-11 w-full text-sm font-medium text-brand-wine">También quiero escribir un nombre →</button>
                    </div>
                  )}
                </div>
                <div className="hidden lg:block">
                <div className="mb-4 space-y-3">
                  {engravings.map((item,index) => (
                    <div key={item.id} className="space-y-3 rounded-xl border border-brand-line bg-brand-sand/40 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => setSelectedTextId(item.id)}
                          className="text-sm font-semibold text-gray-900">Texto {index+1} {selectedTextId===item.id ? "· Seleccionado" : ""}</button>
                        <button type="button" onClick={() => removeText(item.id)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                          aria-label={`Eliminar texto ${index+1}`}>Eliminar</button>
                      </div>
                      <label className="block text-xs font-semibold text-gray-800">Nombre, iniciales o frase
                        <textarea rows={2} maxLength={120} value={item.text} onFocus={() => setSelectedTextId(item.id)}
                          onChange={e => updateText(item.id,{text:e.target.value})}
                          placeholder="Ej. Sofía o una frase corta" className="mt-1 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900"/>
                      </label>
                      <p className="text-right text-xs text-gray-500">{item.text.length}/120 caracteres</p>
                      <label className="block text-xs font-semibold text-gray-800">
                        Altura aproximada del texto: {item.sizeCm.toFixed(1)} cm
                        <input type="range" min="0.5" max="6" step="0.1" value={item.sizeCm}
                          onChange={e => updateText(item.id,{sizeCm:Number(e.target.value)})}
                          className="mt-2 w-full accent-brand-wine" aria-label={`Tamaño del texto ${index+1}`}/>
                        <span className="mt-1 flex justify-between text-xs text-gray-500"><span>Pequeño</span><span>Grande</span></span>
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-gray-800">Tipografía
                          <select value={item.font} onChange={e => updateText(item.id,{font:e.target.value as EngravingItem["font"]})}
                            className="mt-1 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm">
                            <option value="elegante">Elegante · Serif</option><option value="moderna">Minimalista · Sans</option><option value="manuscrita">Manuscrita</option>
                          </select>
                        </label>
                      </div>
                      <p className="text-xs font-semibold text-gray-800">¿Dónde lo ponemos?</p>
                      <div className="grid grid-cols-3 gap-2">
                        {TEXT_PRESETS.filter(p=>["superior","centro","inferior"].includes(p.value)).map(preset=>(
                          <button key={preset.value} type="button"
                            onClick={()=>updateText(item.id,{position:preset.value,x:preset.x,y:preset.y})}
                            aria-pressed={item.position===preset.value}
                            className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-semibold ${item.position===preset.value?"border-brand-wine bg-brand-sand":"border-gray-300 bg-white"}`}>
                            {preset.value==="superior"?"Arriba":preset.value==="inferior"?"Abajo":"Centro"}
                          </button>
                        ))}
                      </div>
                      <details className="rounded-xl border border-gray-200 bg-white p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-800">Más opciones (opcional)</summary>
                        <p className="mt-3 text-xs font-semibold text-gray-700">Colocar en una esquina</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {TEXT_PRESETS.filter(p=>!["superior","centro","inferior"].includes(p.value)).map(preset=>(
                            <button key={preset.value} type="button"
                              onClick={()=>updateText(item.id,{position:preset.value,x:preset.x,y:preset.y})}
                              aria-pressed={item.position===preset.value}
                              className={`min-h-11 rounded-lg border px-1 py-2 text-[11px] ${item.position===preset.value?"border-brand-wine bg-brand-sand":"border-gray-300"}`}>
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <label className="mt-4 block text-xs font-semibold text-gray-700">
                          Girar: {item.rotation}°
                          <input type="range" min="-90" max="90" step="5" value={item.rotation}
                            onChange={e=>updateText(item.id,{rotation:Number(e.target.value)})}
                            className="mt-2 w-full accent-brand-wine" aria-label={`Girar texto ${index+1}`}/>
                        </label>
                        <p className="mt-3 text-xs text-gray-600">Coordenadas aproximadas: X {engravingGeometry(item).xCm} cm · Y {engravingGeometry(item).yCm} cm.</p>
                      </details>
                    </div>
                  ))}
                  <button type="button" onClick={addText} className="min-h-11 w-full rounded-xl border border-brand-wine bg-white px-4 py-2 text-sm font-semibold text-brand-wine">
                    + Añadir otro texto
                  </button>
                  <p className="text-xs leading-5 text-gray-600">Puedes mover el texto sobre el tapete. La vista previa es ilustrativa.</p>
                </div>
                <p className="mb-2 text-xs font-semibold text-gray-600">O sube un logo o diseño</p>

                <label className="flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-center transition hover:border-gray-500 sm:rounded-3xl sm:px-5 sm:py-8">
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

                  <span className="mt-3 hidden max-w-md text-xs leading-5 text-gray-600 sm:block sm:rounded-2xl sm:bg-white sm:px-4 sm:py-3 sm:text-sm sm:leading-6 sm:shadow-sm">
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


                </div>
                <button type="button" onClick={() => setMobileStep("preview")} className="mm-button mt-5 w-full py-3 lg:hidden">Ver mi tapete →</button>
              </div>
            </div>
            <div id="mat-checkout" className="order-4 mb-4 scroll-mt-24 rounded-2xl border border-brand-line bg-white p-4 sm:mb-8 sm:rounded-3xl sm:p-5">
              <h2 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                Comprar tu tapete
              </h2>

              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                <div>
                  <p className="hidden text-xs text-gray-500 sm:block sm:text-sm">Precio por mat</p>
                  <p className="text-lg font-bold text-gray-900 sm:text-2xl">
                    {formatMoney(MAT_PRICE)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-gray-300 bg-white sm:rounded-2xl">
                  <button
                    type="button"
                    onClick={() => updateMatQuantity(safeQuantity - 1)}
                    className="h-12 w-11 text-xl font-bold text-gray-700 hover:bg-gray-100"
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
                    className="h-12 w-12 border-x border-gray-200 text-center font-semibold outline-none sm:w-16"
                  />

                  <button
                    type="button"
                    onClick={() => updateMatQuantity(safeQuantity + 1)}
                    className="h-12 w-11 text-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                    aria-label="Aumentar cantidad"
                    disabled={safeQuantity >= 99}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-2 text-sm font-semibold text-gray-900">Promociones para tu proyecto</p>
                {safeQuantity < 5 && (
                  <div className="mb-3 rounded-xl border border-brand-line bg-brand-sand p-3">
                    <p className="text-sm font-semibold text-brand-ink">10% de descuento aplicado</p>
                    <p className="mt-1 text-xs text-gray-600">Tu beneficio al comprar de 1 a 4 mats.</p>
                  </div>
                )}
                <p className="mb-2 text-xs text-gray-600">
                  {safeQuantity < 5
                    ? `Agrega ${5 - safeQuantity} ${5 - safeQuantity === 1 ? "mat" : "mats"} más para desbloquear beneficios por volumen.`
                    : "Elige el beneficio que prefieras para tu compra."}
                </p>
                <div role="radiogroup" aria-label="Modalidad de promoción" className="grid grid-cols-2 gap-2">
                  <button type="button" role="radio" aria-checked={safeQuantity >= 5 && promotionMode === "msi15"}
                    disabled={safeQuantity < 5} onClick={() => setPromotionMode("msi15")}
                    className={`min-h-20 rounded-xl border p-3 text-left text-xs transition sm:text-sm disabled:cursor-not-allowed ${safeQuantity < 5 ? "border-gray-200 bg-gray-50 text-gray-500" : promotionMode === "msi15" ? "border-brand-wine bg-brand-sand font-semibold ring-1 ring-brand-wine" : "border-gray-200 bg-white"}`}>
                    <span className="block font-semibold">15% OFF + 3 MSI</span>
                    <span className="mt-2 block text-base font-bold text-brand-ink">{formatMoney(Math.round(MAT_PRICE * 0.85 * 100) / 100)} <span className="text-[11px] font-normal text-gray-600">/ mat</span></span>
                    <span className="block text-xs text-gray-500 line-through">{formatMoney(MAT_PRICE)}</span>
                    <span className="mt-1 block text-[11px] font-normal">Desde 5 mats · sujeto a elegibilidad</span>
                    {safeQuantity < 5 && <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">Disponible desde 5 mats</span>}
                  </button>
                  <button type="button" role="radio" aria-checked={safeQuantity >= 5 && promotionMode === "volume20"}
                    disabled={safeQuantity < 5} onClick={() => setPromotionMode("volume20")}
                    className={`min-h-20 rounded-xl border p-3 text-left text-xs transition sm:text-sm disabled:cursor-not-allowed ${safeQuantity < 5 ? "border-gray-200 bg-gray-50 text-gray-500" : promotionMode === "volume20" ? "border-brand-wine bg-brand-sand font-semibold ring-1 ring-brand-wine" : "border-gray-200 bg-white"}`}>
                    <span className="block font-semibold">20% OFF · Contado</span>
                    <span className="mt-2 block text-base font-bold text-brand-ink">{formatMoney(Math.round(MAT_PRICE * 0.80 * 100) / 100)} <span className="text-[11px] font-normal text-gray-600">/ mat</span></span>
                    <span className="block text-xs text-gray-500 line-through">{formatMoney(MAT_PRICE)}</span>
                    <span className="mt-1 block text-[11px] font-normal">Desde 5 mats · sin MSI</span>
                    {safeQuantity < 5 && <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">Disponible desde 5 mats</span>}
                  </button>
                </div>
              </div>

              <div aria-live="polite" className="rounded-xl bg-brand-sand p-3 sm:rounded-2xl sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Total de mats</p>
                    <p className="text-2xl font-bold text-brand-ink">{formatMoney(estimatedTotal)}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-ink">
                    {safeQuantity < 5 ? "10% OFF" : promotionMode === "msi15" ? "15% + 3 MSI" : "20% OFF"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>{safeQuantity} {safeQuantity === 1 ? "mat" : "mats"}</span>
                  {promotionMode === "volume20" && safeQuantity >= 5 && <span>20% de descuento en todos tus tapetes</span>}
                  {savings > 0 && <span className="font-semibold text-green-700">Ahorras {formatMoney(savings)}</span>}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-brand-line bg-white px-4 py-3 text-left text-sm leading-6 text-brand-ink" aria-label="Condiciones de entrega y envío">
                <p><strong>Entrega estimada:</strong> 45 días hábiles.</p>
                <p><strong>Envío:</strong> se cotiza por separado y no está incluido en el precio.</p>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={checkoutLoading}
                aria-busy={checkoutLoading}
                className="mm-button mt-3 flex min-h-14 w-full items-center justify-center px-4 py-3 text-center text-base font-bold disabled:cursor-wait disabled:opacity-60"
              >
                {checkoutLoading ? "Preparando tu compra…" : "Comprar ahora"}
              </button>
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="mm-button-outline mt-2 flex min-h-14 w-full items-center justify-center px-4 py-3 text-center text-base font-bold"
              >
                Consultar por WhatsApp
              </button>
              {checkoutError && (
                <div role="alert" className="mt-3 rounded-xl border border-brand-line bg-brand-sand p-4 text-left text-sm leading-6 text-brand-ink">
                  {checkoutError}
                </div>
              )}

            </div>
          </div>

          <div className={`order-2 w-full min-w-0 self-start bg-white py-1 lg:order-2 lg:sticky lg:top-28 lg:bg-transparent lg:py-0 ${["design","preview","checkout"].includes(mobileStep) ? "" : "hidden lg:block"}`}>
            <div className="w-full rounded-2xl border border-brand-line bg-white p-2 shadow-editorial sm:rounded-[2rem] sm:p-4">
              <div className="mb-1 flex items-center justify-between gap-3 sm:mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 sm:text-lg">
                    Vista previa
                  </h2>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    {`Medidas: ${matDimensions.height} × ${matDimensions.width} cm · ${MAT_THICKNESS_MM} mm`}
                  </p>
                </div>

                <div className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase text-gray-600 sm:px-3 sm:text-xs">
                  {shape}
                </div>
              </div>

              <div
                ref={previewWrapRef}
                className="flex w-full justify-center overflow-hidden rounded-xl bg-brand-sand sm:rounded-[1.5rem]"
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

                      {engravings.filter(t => t.text.trim()).map(item => {
                        const g = engravingGeometry(item);
                        return <KonvaText key={item.id} text={item.text.trim()} rotation={item.rotation}
                          x={matX+g.left} y={matY+g.top} width={g.width} height={g.height}
                          fontFamily={engravingFonts[item.font]} fontSize={g.fontSize}
                          fill={engravingColor} align="center" verticalAlign="middle" wrap="word"
                          draggable onClick={() => setSelectedTextId(item.id)} onTap={() => setSelectedTextId(item.id)}
                          dragBoundFunc={pos => ({
                            x: Math.max(matX + matWidth*.02,Math.min(matX+matWidth*.98-g.width,pos.x)),
                            y: Math.max(matY + matHeight*.12,Math.min(matY+matHeight*.95-g.height,pos.y)),
                          })}
                          onDragEnd={e => updateText(item.id,{
                            position:"libre",
                            x:Math.round((e.target.x()-matX)/(matWidth-g.width)*1000)/10,
                            y:Math.round((e.target.y()-matY)/(matHeight-g.height)*1000)/10,
                          })}
                        />;
                      })}
                      {logos.map((logo) => (
                        <LogoImage
                          key={logo.id}
                          logo={logo}
                          matWidth={matWidth}
                          tintColor={finish.type === "solid" ? engravingColor : null}
                          selected={logo.id === selectedLogoId}
                          onSelect={() => setSelectedLogoId(logo.id)}
                          onChange={updateLogo}
                        />
                      ))}
                    </Layer>
                  </Stage>
                </div>
              </div>

              {selectedLogo && (
                <div className="mt-2 rounded-xl border border-brand-line bg-white p-3 sm:mt-3" aria-label="Ajustar logo seleccionado">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-brand-ink">Ajusta tu logo</span>
                    <button type="button" onClick={removeSelectedLogo} className="min-h-10 px-2 text-xs font-semibold text-red-700">Eliminar</button>
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2 sm:items-center">
                    <label className="block min-w-0">
                      <span className="flex justify-between text-xs font-medium text-gray-700"><span>Tamaño</span><span>{selectedLogo.widthPercent}%</span></span>
                      <input type="range" min="5" max="100" step="1" value={selectedLogo.widthPercent}
                        aria-label="Tamaño del logo"
                        onChange={e=>updateLogo({...selectedLogo,widthPercent:Number(e.target.value)})}
                        className="mt-1 min-h-10 w-full accent-brand-wine"/>
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-700">Girar · {selectedLogo.rotation}°</span>
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label="Girar 45 grados a la izquierda" onClick={()=>updateLogo({...selectedLogo,rotation:(selectedLogo.rotation+315)%360})} className="min-h-11 min-w-11 rounded-xl border border-brand-line bg-white text-lg">↶</button>
                        <button type="button" aria-label="Girar 45 grados a la derecha" onClick={()=>updateLogo({...selectedLogo,rotation:(selectedLogo.rotation+45)%360})} className="min-h-11 min-w-11 rounded-xl border border-brand-line bg-white text-lg">↷</button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Arrastra el logo sobre el tapete para colocarlo.</p>
                </div>
              )}

              <div className="mt-2 hidden grid-cols-2 gap-2 sm:mt-5 sm:gap-3 lg:grid">
                <button
                  onClick={downloadPNG}
                  className="min-h-11 rounded-xl bg-gray-900 px-3 py-3 text-xs font-bold text-white transition hover:bg-gray-700 sm:rounded-full sm:px-5 sm:text-sm"
                  type="button"
                >
                  Descargar imagen
                </button>

                <button
                  onClick={downloadPDF}
                  className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 py-3 text-xs font-bold text-gray-900 transition hover:bg-gray-50 sm:rounded-full sm:px-5 sm:text-sm"
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
