import * as React from "react";

import { cn } from "@/lib/utils";

type GlowFieldProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Signature moment: a subtle pointer-follow glow using the design-system gradient.
 * Respects prefers-reduced-motion by avoiding continuous animations.
 */
export function GlowField({ children, className }: GlowFieldProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const setVars = React.useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={(e) => setVars(e.clientX, e.clientY)}
      className={cn(
        "relative min-h-screen bg-background font-sans",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-brand-soft before:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
