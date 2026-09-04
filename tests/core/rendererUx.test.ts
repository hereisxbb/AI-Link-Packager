import { describe, expect, it } from "vitest";
import { formatFileSize, summarizePackageRows } from "../../src/renderer/ux";

describe("renderer UX helpers", () => {
  it("formats file sizes for compact file metadata", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
  });

  it("summarizes packaging outcomes for the completion screen", () => {
    const summary = summarizePackageRows([
      { status: "success" },
      { status: "success" },
      { status: "partial_success" },
      { status: "failed" }
    ]);

    expect(summary).toEqual({ success: 2, partial: 1, failed: 1, total: 4 });
  });
});
