"use client";

/**
 * AnimatedSection — Wraps content in a scroll-triggered fade-in animation.
 *
 * Uses Intersection Observer to add a CSS class when the element enters
 * the viewport, triggering a fade-in + slide-up animation.
 * Properly cleans up timeouts and observers on unmount.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before animation starts */
  delay?: number;
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            const id = window.setTimeout(() => setIsVisible(true), delay);
            // Store timeout on element for cleanup
            (element as HTMLElement & { _timeoutId?: number })._timeoutId = id;
          } else {
            setIsVisible(true);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      const el = element as HTMLElement & { _timeoutId?: number };
      if (el._timeoutId) {
        clearTimeout(el._timeoutId);
      }
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}
