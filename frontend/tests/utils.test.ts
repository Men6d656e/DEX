import { describe, it, expect } from "vitest";
import {
  calculateOutput,
  applySlippage,
  formatDexBalance,
  formatRate,
  calculatePriceImpact,
} from "@/hooks/use-dex";

// ================================================================
// calculateOutput
// ================================================================

describe("calculateOutput", () => {
  it("returns 0 when amountIn is 0", () => {
    expect(calculateOutput(0n, 1700n * 10n ** 18n, true)).toBe(0n);
    expect(calculateOutput(0n, 1700n * 10n ** 18n, false)).toBe(0n);
  });

  it("calculates correct output for mETH → mUSDC", () => {
    // 1 mETH at rate 1700 → 1700 mUSDC
    const result = calculateOutput(10n ** 18n, 1700n * 10n ** 18n, true);
    expect(result).toBe(1700n * 10n ** 18n);
  });

  it("calculates correct output for mUSDC → mETH", () => {
    // 1700 mUSDC at rate 1700 → 1 mETH
    const result = calculateOutput(
      1700n * 10n ** 18n,
      1700n * 10n ** 18n,
      false,
    );
    expect(result).toBe(10n ** 18n);
  });

  it("handles partial amounts correctly", () => {
    // 0.5 mETH at rate 1700 → 850 mUSDC
    const result = calculateOutput(
      5n * 10n ** 17n,
      1700n * 10n ** 18n,
      true,
    );
    expect(result).toBe(850n * 10n ** 18n);
  });

  it("handles large amounts without overflow", () => {
    const result = calculateOutput(
      1000n * 10n ** 18n,
      1700n * 10n ** 18n,
      true,
    );
    expect(result).toBe(1_700_000n * 10n ** 18n);
  });
});

// ================================================================
// applySlippage
// ================================================================

describe("applySlippage", () => {
  it("returns 0 when output is 0", () => {
    expect(applySlippage(0n, 50)).toBe(0n);
  });

  it("applies 0.5% slippage correctly", () => {
    // 1000 with 0.5% slippage → 995
    const result = applySlippage(1000n * 10n ** 18n, 50);
    expect(result).toBe(995n * 10n ** 18n);
  });

  it("applies 1% slippage correctly", () => {
    const result = applySlippage(1000n * 10n ** 18n, 100);
    expect(result).toBe(990n * 10n ** 18n);
  });

  it("applies 0% slippage (no slippage)", () => {
    const result = applySlippage(1000n * 10n ** 18n, 0);
    expect(result).toBe(1000n * 10n ** 18n);
  });

  it("applies 100% slippage (worst case)", () => {
    const result = applySlippage(1000n * 10n ** 18n, 10000);
    expect(result).toBe(0n);
  });
});

// ================================================================
// formatDexBalance
// ================================================================

describe("formatDexBalance", () => {
  it("formats whole numbers correctly", () => {
    expect(formatDexBalance(10n * 10n ** 18n)).toBe("10");
  });

  it("formats large numbers with commas", () => {
    expect(formatDexBalance(1_000_000n * 10n ** 18n)).toBe("1,000,000");
  });

  it("formats decimal values correctly", () => {
    const result = formatDexBalance(10500000000000000000n); // 10.5
    expect(result).toBe("10.5");
  });

  it("formats very small values", () => {
    const result = formatDexBalance(1000000000000000n); // 0.001
    expect(result).toBe("0.001");
  });

  it("trims trailing zeros", () => {
    const result = formatDexBalance(10500000000000000000n); // 10.5000... → 10.5
    expect(result).toBe("10.5");
  });
});

// ================================================================
// formatRate
// ================================================================

describe("formatRate", () => {
  it("returns em dash for undefined", () => {
    expect(formatRate(undefined)).toBe("—");
  });

  it("formats rate with 2 decimal places", () => {
    const result = formatRate(1700n * 10n ** 18n);
    expect(result).toBe("1,700");
  });

  it("handles rates below 1", () => {
    const result = formatRate(5n * 10n ** 17n); // 0.5
    expect(result).toBe("0.5");
  });
});

// ================================================================
// calculatePriceImpact
// ================================================================

describe("calculatePriceImpact", () => {
  it("returns 0 when amountIn is 0", () => {
    expect(calculatePriceImpact(0n, 1000n * 10n ** 18n)).toBe(0);
  });

  it("returns 0 when reserve is 0", () => {
    expect(calculatePriceImpact(10n * 10n ** 18n, 0n)).toBe(0);
  });

  it("calculates small price impact correctly", () => {
    // Swapping 1 against 1000 reserve → ~0.1% impact
    const result = calculatePriceImpact(10n ** 18n, 1000n * 10n ** 18n);
    expect(result).toBeCloseTo(0.1, 1);
  });

  it("calculates large price impact correctly", () => {
    // Swapping 500 against 1000 reserve → ~33.33% impact
    const result = calculatePriceImpact(
      500n * 10n ** 18n,
      1000n * 10n ** 18n,
    );
    expect(result).toBeCloseTo(33.33, 0);
  });
});
