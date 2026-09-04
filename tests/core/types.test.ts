import { describe, expect, it } from "vitest";
import type { PackageStatus } from "../../src/core/types";

describe("domain types", () => {
  it("allows the expected package statuses", () => {
    const statuses: PackageStatus[] = ["success", "partial_success", "failed"];
    expect(statuses).toEqual(["success", "partial_success", "failed"]);
  });
});
