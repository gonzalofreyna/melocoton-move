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
      className={`absolute ${posCls} z-30 border shadow-md ${shapeCls} ${sizeCls} ${textTransform} inline-flex items-center gap-1.5 sm:gap-2 origin-top-left scale-[0.78] sm:scale-120`}
      style={{
        ...style,
        maxWidth: "130px", // +20%
        maxHeight: "48px", // +20%
      }}
    >
      {showIcon && (
        <img
          src={cfg.icon!.src}
          alt={cfg.icon!.alt || ""}
          width={cfg.icon!.size ? Math.min(cfg.icon!.size * 0.6, 34) : 24}
          height={cfg.icon!.size ? Math.min(cfg.icon!.size * 0.6, 34) : 24}
          className="inline-block object-contain"
          style={{
            maxWidth: "26px",
            maxHeight: "26px",
          }}
        />
      )}
      {showText && (
        <span className="font-semibold leading-none text-[10px] sm:text-[13px] whitespace-nowrap">
          {cfg.text}
        </span>
      )}
    </div>
  );
}

function positionClass(pos: OfferBadgeConfig["position"]): string {
  switch (pos) {
    case "top-left":
      return "top-2 left-2 sm:top-3 sm:left-3";
    case "top-right":
      return "top-2 right-2 sm:top-3 sm:right-3";
    case "bottom-left":
      return "bottom-2 left-2 sm:bottom-3 sm:left-3";
    case "bottom-right":
      return "bottom-2 right-2 sm:bottom-3 sm:right-3";
    default:
      return "top-2 left-2 sm:top-3 sm:left-3";
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
  // +20% en proporciones
  switch (size) {
    case "sm":
      return "px-1.5 py-0.5 text-[9.5px] sm:px-2.5 sm:py-0.5 sm:text-[12px]";
    case "md":
      return "px-2 py-0.5 text-[10.8px] sm:px-3 sm:py-1 sm:text-[13px]";
    case "lg":
      return "px-2.5 py-0.5 text-[11.5px] sm:px-3.5 sm:py-1.5 sm:text-[14.5px]";
    default:
      return "px-2 py-0.5 text-[10.8px] sm:px-3 sm:py-1 sm:text-[13px]";
  }
}
