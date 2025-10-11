// components/Logo.tsx
"use client";

export default function Logo({ className = "" }) {
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: "auto",
        height: "80px", // Ajusta si lo quieres más grande o pequeño
      }}
    >
      {/* 🎨 Fondo animado pastel dentro del logo */}
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          WebkitMaskImage: "url('/images/logonice.svg')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          maskImage: "url('/images/logonice.svg')",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          maskPosition: "center",
          background:
            "linear-gradient(270deg, #fbc2eb, #d8c7f9, #a6c1ee, #fbc2eb)",
          backgroundSize: "300% 300%",
          animation: "gradientShift 10s ease-in-out infinite",
        }}
      />
    </div>
  );
}
