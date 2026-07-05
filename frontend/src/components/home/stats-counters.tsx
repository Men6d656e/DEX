"use client";

/**
 * Animated statistics counters.
 *
 * Uses Intersection Observer to trigger a counting animation
 * when the section scrolls into view.
 */
import { useEffect, useRef, useState } from "react";

interface StatItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const STATS: StatItem[] = [
  { label: "Mock Tokens Minted", value: 1_000_000, suffix: "+", decimals: 0 },
  { label: "Active Users", value: 50_000, suffix: "+", decimals: 0 },
  { label: "Trades Executed", value: 250_000, suffix: "+", decimals: 0 },
  { label: "Supported Tokens", value: 3, suffix: "", decimals: 0 },
];

/**
 * Animated counter that counts from 0 to target when visible.
 * Uses requestAnimationFrame with proper cleanup on unmount.
 */
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  isVisible,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const duration = 2000; // 2 seconds
    const startValue = 0;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (value - startValue) * eased);
      setCount(current);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    }

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isVisible, value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Individual stat card.
 */
function StatCard({
  stat,
  isVisible,
}: {
  stat: StatItem;
  isVisible: boolean;
}) {
  return (
    <div className="flex flex-col items-center p-6">
      <div className="text-3xl sm:text-4xl font-bold text-foreground">
        <AnimatedCounter
          value={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          isVisible={isVisible}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        {stat.label}
      </p>
    </div>
  );
}

/**
 * Stats grid with scroll-triggered counting animation.
 */
export function StatsCounters() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 px-6 border-y border-border bg-card/50">
      <div
        ref={ref}
        className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} isVisible={isVisible} />
        ))}
      </div>
    </section>
  );
}
