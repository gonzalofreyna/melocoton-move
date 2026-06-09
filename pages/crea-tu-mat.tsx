// pages/crea-tu-mat.tsx
import dynamic from "next/dynamic";

const MatCustomizer = dynamic(() => import("../components/MatCustomizer"), {
  ssr: false,
});

export default function CreaTuMatPage() {
  return <MatCustomizer />;
}
