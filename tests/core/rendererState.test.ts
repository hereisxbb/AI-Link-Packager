import { describe, expect, it } from "vitest";

function canStartScan(inputCount: number, outputRoot?: string): boolean {
  return inputCount > 0 && Boolean(outputRoot);
}

describe("renderer start state", () => {
  it("requires at least one input and an output directory", () => {
    expect(canStartScan(0, "F:\\输出")).toBe(false);
    expect(canStartScan(1, undefined)).toBe(false);
    expect(canStartScan(1, "F:\\输出")).toBe(true);
  });
});
