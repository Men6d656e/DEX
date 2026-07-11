"use client";

/**
 * Callout — a styled alert/info/warning/error/success box.
 *
 * Variants:
 * - info (blue)
 * - warning (amber)
 * - error (red)
 * - success (green)
 */
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalloutProps {
  type: "info" | "warning" | "error" | "success";
  children: React.ReactNode;
  className?: string;
}

const CALLOUT_CONFIG = {
  info: {
    icon: Info,
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    iconColor: "text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    iconColor: "text-amber-400",
  },
  error: {
    icon: XCircle,
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-400",
    iconColor: "text-red-400",
  },
  success: {
    icon: CheckCircle,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    iconColor: "text-emerald-400",
  },
};

export function Callout({ type, children, className }: CalloutProps) {
  const config = CALLOUT_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed",
        config.border,
        config.bg,
        config.text,
        className,
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.iconColor)} />
      <div className="[&_strong]:font-semibold [&_code]:text-xs [&_code]:bg-background/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
        {children}
      </div>
    </div>
  );
}
