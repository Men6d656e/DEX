"use client";

/**
 * CandlestickChart — Custom SVG candlestick chart for OHLC price data.
 *
 * Each candle shows: open, high, low, and close prices.
 * Green candles = price went up (close > open)
 * Red candles = price went down (close < open)
 *
 * Features:
 * - Responsive SVG with viewBox
 * - Y-axis price labels (auto-scaled)
 * - X-axis date labels
 * - Grid lines
 * - Hover tooltip showing OHLC values
 * - Loading skeleton
 */
import { useState, useMemo, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CandleData } from "@/lib/market-data";

interface CandlestickChartProps {
  data: CandleData[];
  coinLabel?: string;
  isLoading?: boolean;
  isSimulated?: boolean;
  height?: number;
}

/** Format a number with K/M/B suffixes */
function formatPrice(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

/** Format a timestamp to a short date string */
function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format a timestamp to a full date-time string */
function formatFullDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CandlestickChart({
  data,
  coinLabel = "Price",
  isLoading = false,
  isSimulated = false,
  height = 400,
}: CandlestickChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ── Layout ──
  const PADDING = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartWidth = 800;
  const chartHeight = height;
  const plotWidth = chartWidth - PADDING.left - PADDING.right;
  const plotHeight = chartHeight - PADDING.top - PADDING.bottom;

  // ── Scale helpers ──
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (data.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    let min = data[0].low;
    let max = data[0].high;
    for (const d of data) {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    }
    const padding = (max - min) * 0.1 || max * 0.1 || 10;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: max - min + 2 * padding,
    };
  }, [data]);

  const xScale = useCallback(
    (i: number) =>
      PADDING.left + (i / Math.max(data.length - 1, 1)) * plotWidth,
    [data.length, plotWidth],
  );

  const yScale = useCallback(
    (price: number) =>
      PADDING.top +
      plotHeight -
      ((price - minPrice) / priceRange) * plotHeight,
    [minPrice, priceRange, plotHeight],
  );

  // ── Y-axis ticks ──
  const yTicks = useMemo(() => {
    const count = 6;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(minPrice + (priceRange * i) / count);
    }
    return ticks;
  }, [minPrice, priceRange]);

  // ── X-axis labels (show ~6 labels) ──
  const xLabels = useMemo(() => {
    const count = Math.min(6, data.length);
    const step = Math.max(1, Math.floor(data.length / (count - 1)));
    const labels: { index: number; label: string }[] = [];
    for (let i = 0; i < data.length; i += step) {
      labels.push({ index: i, label: formatDate(data[i].time) });
    }
    // Always include the last one
    if (labels.length > 0 && labels[labels.length - 1].index < data.length - 1) {
      labels.push({
        index: data.length - 1,
        label: formatDate(data[data.length - 1].time),
      });
    }
    return labels;
  }, [data]);

  // ── Candle dimensions ──
  const candleWidth = Math.max(2, plotWidth / data.length * 0.6);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-card animate-pulse"
        style={{ height }}
      >
        <div className="p-5 space-y-3">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-[300px] rounded bg-muted" />
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border border-border bg-card flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">No price data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{coinLabel} Chart</h3>
          {isSimulated && (
            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
              Simulated
            </span>
          )}
        </div>
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="text-xs text-muted-foreground tabular-nums">
            {formatFullDate(data[hoveredIndex].time)}
          </div>
        )}
      </div>

      {/* Chart SVG */}
      <div className="w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Candlestick chart for ${coinLabel}`}
        >
          {/* ── Grid lines ── */}
          {yTicks.map((tick) => (
            <g key={`grid-${tick}`}>
              <line
                x1={PADDING.left}
                y1={yScale(tick)}
                x2={chartWidth - PADDING.right}
                y2={yScale(tick)}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
                opacity={0.5}
              />
            </g>
          ))}

          {/* ── Y-axis labels ── */}
          {yTicks.map((tick) => (
            <text
              key={`y-${tick}`}
              x={PADDING.left - 8}
              y={yScale(tick) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[10px] font-mono tabular-nums"
            >
              {formatPrice(tick)}
            </text>
          ))}

          {/* ── X-axis labels ── */}
          {xLabels.map(({ index, label }) => (
            <text
              key={`x-${index}`}
              x={xScale(index)}
              y={chartHeight - 10}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {label}
            </text>
          ))}

          {/* ── Candles ── */}
          {data.map((candle, i) => {
            const isUp = candle.close >= candle.open;
            const color = isUp ? "#22c55e" : "#ef4444";
            const bodyTop = Math.max(candle.open, candle.close);
            const bodyBottom = Math.min(candle.open, candle.close);
            const x = xScale(i) - candleWidth / 2;
            const bodyHeight = Math.max(
              yScale(bodyBottom) - yScale(bodyTop),
              1,
            );
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={candle.time}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Wick (high → body top, body bottom → low) */}
                <line
                  x1={xScale(i)}
                  y1={yScale(candle.high)}
                  x2={xScale(i)}
                  y2={yScale(bodyTop)}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={isHovered ? 1 : 0.7}
                />
                <line
                  x1={xScale(i)}
                  y1={yScale(bodyBottom)}
                  x2={xScale(i)}
                  y2={yScale(candle.low)}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={isHovered ? 1 : 0.7}
                />

                {/* Body */}
                <rect
                  x={x}
                  y={yScale(bodyTop)}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  opacity={isHovered ? 1 : 0.8}
                  rx={1}
                />

                {/* Hover highlight */}
                {isHovered && (
                  <line
                    x1={xScale(i)}
                    y1={PADDING.top}
                    x2={xScale(i)}
                    y2={chartHeight - PADDING.bottom}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.3}
                  />
                )}

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={Math.min(
                        xScale(i) + 10,
                        chartWidth - PADDING.right - 120,
                      )}
                      y={PADDING.top + 5}
                      width={120}
                      height={72}
                      rx={4}
                      fill="hsl(var(--background))"
                      stroke="currentColor"
                      className="stroke-border"
                      opacity={0.95}
                    />
                    <text
                      x={Math.min(xScale(i) + 16, chartWidth - PADDING.right - 114)}
                      y={PADDING.top + 20}
                      className="fill-foreground text-[10px] font-medium"
                    >
                      O ${candle.open.toFixed(2)}
                    </text>
                    <text
                      x={Math.min(xScale(i) + 16, chartWidth - PADDING.right - 114)}
                      y={PADDING.top + 33}
                      className="fill-foreground text-[10px] font-medium"
                    >
                      H ${candle.high.toFixed(2)}
                    </text>
                    <text
                      x={Math.min(xScale(i) + 16, chartWidth - PADDING.right - 114)}
                      y={PADDING.top + 46}
                      className="fill-foreground text-[10px] font-medium"
                    >
                      L ${candle.low.toFixed(2)}
                    </text>
                    <text
                      x={Math.min(xScale(i) + 16, chartWidth - PADDING.right - 114)}
                      y={PADDING.top + 59}
                      className={cn(
                        "text-[10px] font-medium",
                        isUp ? "fill-emerald-500" : "fill-red-500",
                      )}
                    >
                      C ${candle.close.toFixed(2)}
                    </text>
                    <text
                      x={Math.min(xScale(i) + 16, chartWidth - PADDING.right - 114)}
                      y={PADDING.top + 72}
                      className="fill-muted-foreground text-[9px]"
                    >
                      {isUp ? `▲ ${((candle.close - candle.open) / candle.open * 100).toFixed(2)}%` : `▼ ${((candle.open - candle.close) / candle.open * 100).toFixed(2)}%`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
