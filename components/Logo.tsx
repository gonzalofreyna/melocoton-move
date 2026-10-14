"use client";

export default function Logo({ className = "", tone = "dark" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        height: "auto",
      }}
    >
      {/* 🎨 Fondo animado pastel dentro del logo */}
      <div
        className="w-full h-full max-w-[320px] aspect-[260/90] animate-logo-gradient"
        style={{
          WebkitMaskImage: "url('/images/logonice.svg')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          maskImage: "url('/images/logonice.svg')",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          maskPosition: "center",
          background: tone === "light" ? "#FFFFFF" : "#3E3236",
          backgroundSize: "400% 400%",
          backgroundPosition: "0% 50%",
        }}
      />
    </div>
  );
}
