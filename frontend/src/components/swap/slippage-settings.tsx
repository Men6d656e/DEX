"use client";

/**
 * Slippage Settings — Sheet component for configuring swap slippage tolerance.
 *
 * Provides:
 * - Preset buttons (0.1%, 0.5%, 1%, 2.5%)
 * - Custom input for any value
 * - Visual indicator of current selection
 */
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Preset slippage options (in percentage) */
const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0, 2.5] as const;

interface SlippageSettingsProps {
  slippage: number;
  onSlippageChange: (value: number) => void;
}

export function SlippageSettings({
  slippage,
  onSlippageChange,
}: SlippageSettingsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="text-xs">{slippage}%</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Slippage Settings</SheetTitle>
          <SheetDescription>
            Your transaction will revert if the price changes unfavorably by
            more than this percentage.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Presets */}
          <div>
            <label className="text-sm font-medium">Slippage Tolerance</label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {SLIPPAGE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={slippage === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSlippageChange(preset)}
                  className={cn(
                    "text-xs font-medium",
                    slippage === preset
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {preset}%
                </Button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div>
            <label htmlFor="custom-slippage" className="text-sm font-medium">
              Custom
            </label>
            <div className="mt-2 relative">
              <Input
                id="custom-slippage"
                type="number"
                min={0.01}
                max={50}
                step={0.01}
                value={slippage}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    onSlippageChange(val);
                  }
                }}
                className="pr-8 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-blue-500 font-medium mt-0.5">ℹ</span>
              <p>
                High slippage tolerance increases the risk of
                front-running. We recommend 0.5% for most trades.
              </p>
            </div>
            {slippage >= 5 && (
              <div className="flex items-start gap-2 text-xs text-amber-500">
                <span className="font-medium mt-0.5">⚠</span>
                <p>
                  High slippage tolerance selected. Your transaction is at
                  higher risk of sandwich attacks.
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
