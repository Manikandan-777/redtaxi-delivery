import { describe, it, expect } from "vitest";
import tailwindConfig from "../tailwind.config";
import { colors, minTouchTarget } from "@redtaxi/shared";
import {
  colors as mobileColors,
  minTouchTarget as mobileTouchTarget,
} from "../../mobile/src/theme/tokens";

describe("T2.1: Design Tokens Parity (Web Tailwind vs Mobile Theme)", () => {
  it("Tailwind theme colors match @redtaxi/shared colors exactly", () => {
    const twColors = tailwindConfig.theme?.extend?.colors as Record<string, string>;
    expect(twColors).toBeDefined();

    expect(twColors.accent).toBe(colors.accent);
    expect(twColors.accentLight).toBe(colors.accentLight);
    expect(twColors.surface).toBe(colors.surface);
    expect(twColors.bgDark).toBe(colors.bgDark);
    expect(twColors.background).toBe(colors.background);
    expect(twColors.white).toBe(colors.white);
    expect(twColors.ink).toBe(colors.ink);
    expect(twColors.body).toBe(colors.body);
    expect(twColors.muted).toBe(colors.muted);
    expect(twColors.success).toBe(colors.success);
    expect(twColors.danger).toBe(colors.danger);
    expect(twColors.warning).toBe(colors.warning);
    expect(twColors.star).toBe(colors.star);
  });

  it("Tailwind theme colors equal Mobile theme values identically", () => {
    const twColors = tailwindConfig.theme?.extend?.colors as Record<string, string>;
    expect(twColors.accent).toBe(mobileColors.accent);
    expect(twColors.success).toBe(mobileColors.success);
    expect(twColors.danger).toBe(mobileColors.danger);
    expect(twColors.warning).toBe(mobileColors.warning);
    expect(twColors.star).toBe(mobileColors.star);
    expect(twColors.surface).toBe(mobileColors.surface);
    expect(twColors.background).toBe(mobileColors.background);
    expect(twColors.ink).toBe(mobileColors.ink);
    expect(twColors.body).toBe(mobileColors.body);
    expect(twColors.muted).toBe(mobileColors.muted);
  });

  it("Touch target constant is >= 44 on both platforms", () => {
    expect(minTouchTarget).toBe(44);
    expect(mobileTouchTarget).toBe(44);
  });
});
