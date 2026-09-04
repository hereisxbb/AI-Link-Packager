import { mkdir, symlink, writeFile, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanAiFiles } from "../../src/core/scanAiFiles";

async function touchFile(filePath: string, date: Date): Promise<void> {
  await writeFile(filePath, "sample");
  await utimes(filePath, date, date);
}

describe("scanAiFiles", () => {
  it("recursively finds ai files and keeps Chinese paths", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `ai-scan-${Date.now()}`, "中文"), { recursive: true });
    if (!root) throw new Error("failed to create temp root");
    await touchFile(path.join(root, "挑战赛.ai"), new Date("2026-06-01T00:00:00Z"));
    await touchFile(path.join(root, "ignore.png"), new Date("2026-06-01T00:00:00Z"));

    const result = await scanAiFiles({
      inputPaths: [root],
      recursive: true,
      since: undefined,
      excludePaths: []
    });

    expect(result.map((entry) => entry.name)).toEqual(["挑战赛.ai"]);
  });

  it("filters by modified date and excludes output directories", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `ai-date-${Date.now()}`), { recursive: true });
    if (!root) throw new Error("failed to create temp root");
    const output = path.join(root, "output");
    await mkdir(output, { recursive: true });
    await touchFile(path.join(root, "old.ai"), new Date("2026-04-30T00:00:00Z"));
    await touchFile(path.join(root, "new.ai"), new Date("2026-05-02T00:00:00Z"));
    await touchFile(path.join(output, "packaged.ai"), new Date("2026-05-03T00:00:00Z"));

    const result = await scanAiFiles({
      inputPaths: [root],
      recursive: true,
      since: "2026-05-01",
      excludePaths: [output]
    });

    expect(result.map((entry) => entry.name)).toEqual(["new.ai"]);
  });

  it("does not traverse symlinked directories in non-recursive or recursive scans", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `ai-link-${Date.now()}`, "root"), { recursive: true });
    if (!root) throw new Error("failed to create temp root");
    const outside = path.join(path.dirname(root), "outside");
    await mkdir(outside, { recursive: true });
    await touchFile(path.join(outside, "linked.ai"), new Date("2026-06-01T00:00:00Z"));

    try {
      await symlink(outside, path.join(root, "linked-dir"), "dir");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "ENOSYS") return;
      throw error;
    }

    const nonRecursive = await scanAiFiles({
      inputPaths: [root],
      recursive: false,
      since: undefined,
      excludePaths: []
    });
    const recursive = await scanAiFiles({
      inputPaths: [root],
      recursive: true,
      since: undefined,
      excludePaths: []
    });

    expect(nonRecursive).toEqual([]);
    expect(recursive).toEqual([]);
  });
});
