import { useEffect, useState } from "react";

// Scroll direction with hysteresis: tiny wheel/touch deltas don't flicker the navigation.
// The components remain mounted; only their transforms and opacity are animated.
export function useScrollVisibility(threshold = 70) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let previous = window.scrollY;
    let directionStart = previous;
    let direction = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      const current = Math.max(0, window.scrollY);
      const delta = current - previous;
      previous = current;
      if (current <= threshold) {
        direction = 0;
        directionStart = current;
        setVisible(true);
        return;
      }
      if (Math.abs(delta) < 0.5) return;
      const nextDirection = delta > 0 ? 1 : -1;
      if (nextDirection !== direction) {
        direction = nextDirection;
        directionStart = current - delta;
      }
      if (Math.abs(current - directionStart) >= 10) {
        setVisible(nextDirection < 0);
        directionStart = current;
      }
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    previous = Math.max(0, window.scrollY);
    setVisible(previous <= threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return visible;
}
