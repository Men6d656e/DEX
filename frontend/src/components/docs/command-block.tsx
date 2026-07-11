"use client";

/**
 * CommandBlock — a styled terminal command display block.
 *
 * Shows a command with a copy button and an optional label.
 */
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBlockProps {
  command: string;
  label?: string;
  className?: string;
}

export function CommandBlock({ command, label, className }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      {label && (
        <div className="px-4 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
          {label}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 bg-muted/30 px-4 py-3">
        <code className="text-sm font-mono text-foreground break-all select-all">
          $ {command}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label={copied ? "Copied" : "Copy command"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
