import { useEffect, useState } from "react";

export function useScrollVisibility(threshold = 50) {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        setVisible(false); // Ocultar al bajar
      } else {
        setVisible(true); // Mostrar al subir
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, threshold]);

  return visible;
}
