import { describe, expect, it } from "vitest";
import path from "node:path";
import { sanitizeProjectName, uniqueChildPath } from "../../src/core/safeNames";

describe("sanitizeProjectName", () => {
  it("preserves Chinese names and spaces while removing Windows-invalid characters", () => {
    expect(sanitizeProjectName("挑战赛 v1:包装/源文件.ai")).toBe("挑战赛 v1_包装_源文件");
  });

  it("uses a stable fallback for names that become empty", () => {
    expect(sanitizeProjectName("///:::***")).toBe("untitled-ai");
  });
});

describe("uniqueChildPath", () => {
  it("adds a numeric suffix when the desired child path already exists", async () => {
    const existing = new Set([
      pathForTest("pack.ai"),
      pathForTest("pack_2.ai")
    ]);

    await expect(
      uniqueChildPath(pathForTest(""), "pack.ai", async (targetPath) => existing.has(targetPath))
    ).resolves.toBe(pathForTest("pack_3.ai"));
  });

  it("keeps path-like desired names inside the parent directory", async () => {
    const parentDir = pathForTest("");

    const result = await uniqueChildPath(parentDir, "..\\original.ai", async () => false);

    expect(path.resolve(result)).toBe(path.resolve(parentDir, "original.ai"));
  });
});

function pathForTest(childName: string): string {
  return childName.length > 0 ? `C:\\output\\${childName}` : "C:\\output";
}
