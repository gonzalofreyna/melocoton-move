// components/OfferBadge.tsx
import * as React from "react";
import type { OfferBadgeConfig } from "../lib/fetchConfig";

export default function OfferBadge({ cfg }: { cfg: OfferBadgeConfig }) {
  const posCls = positionClass(cfg.position);
  const shapeCls = shapeClass(cfg.shape);
  const sizeCls = sizeClass(cfg.size);
  const textTransform = cfg.uppercase ? "uppercase" : "";

  const style = {
    backgroundColor: cfg.colors.bg,
    color: cfg.colors.text,
    borderColor: cfg.colors.border,
  } as React.CSSProperties;

  const showIcon = cfg.mode !== "text" && cfg.icon?.enabled && !!cfg.icon.src;
  const showText = cfg.mode !== "icon" && !!cfg.text?.trim();

  return (
    <div
      className={`absolute ${posCls} z-30 border shadow-md ${shapeCls} ${sizeCls} ${textTransform} inline-flex items-center gap-1`}
      style={style}
    >
      {showIcon && (
        <img
          src={cfg.icon!.src}
          alt={cfg.icon!.alt || ""}
          width={cfg.icon!.size}
          height={cfg.icon!.size}
          className="inline-block"
        />
      )}
      {showText && (
        <span className="font-semibold leading-none">{cfg.text}</span>
      )}
    </div>
  );
}

function positionClass(pos: OfferBadgeConfig["position"]): string {
  switch (pos) {
    case "top-left":
      return "top-3 left-3";
    case "top-right":
      return "top-3 right-3";
    case "bottom-left":
      return "bottom-3 left-3";
    case "bottom-right":
      return "bottom-3 right-3";
    default:
      return "top-3 left-3";
  }
}

function shapeClass(shape: OfferBadgeConfig["shape"]): string {
  switch (shape) {
    case "pill":
      return "rounded-full";
    case "rounded":
      return "rounded-md";
    case "square":
      return "rounded-none";
    default:
      return "rounded-md";
  }
}

function sizeClass(size: OfferBadgeConfig["size"]): string {
  switch (size) {
    case "sm":
      return "px-2 py-0.5 text-[10px]";
    case "md":
      return "px-2.5 py-1 text-xs";
    case "lg":
      return "px-3 py-1.5 text-sm";
    default:
      return "px-2.5 py-1 text-xs";
  }
}
