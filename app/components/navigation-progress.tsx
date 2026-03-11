import { useNavigation } from "react-router";
import { useEffect, useRef, useCallback } from "react";

export function NavigationProgress() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, []);

  useEffect(() => {
    cleanup();

    if (isNavigating) {
      if (containerRef.current) containerRef.current.style.display = "block";
      if (barRef.current) barRef.current.style.width = "0%";

      const start = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const next = Math.min(90, (elapsed / 3000) * 90);
        if (barRef.current) barRef.current.style.width = `${next}%`;
      }, 50);
    } else {
      if (barRef.current) barRef.current.style.width = "100%";
      hideTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) containerRef.current.style.display = "none";
        if (barRef.current) barRef.current.style.width = "0%";
      }, 200);
    }

    return cleanup;
  }, [isNavigating, cleanup]);

  return (
    <div ref={containerRef} className="fixed top-0 left-0 right-0 z-[9999] h-0.5" style={{ display: "none" }}>
      <div
        ref={barRef}
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: "0%" }}
      />
    </div>
  );
}
