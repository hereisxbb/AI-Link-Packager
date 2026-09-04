import path from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { toCsv, writePackageReport } from "../../src/reports/csvReport";
import type { PackageReportRow } from "../../src/core/types";

describe("toCsv", () => {
  it("escapes commas, quotes, and Chinese missing paths", () => {
    const rows: PackageReportRow[] = [
      {
        aiPath: "F:\\设计\\挑战赛.ai",
        status: "partial_success",
        linkCount: 2,
        foundLinkCount: 1,
        missingLinkCount: 1,
        missingPaths: ["F:\\素材\\缺失,文件\"01.png"],
        outputDir: "F:\\输出\\挑战赛",
        errorMessage: ""
      }
    ];

    expect(toCsv(rows)).toContain("\"F:\\素材\\缺失,文件\"\"01.png\"");
  });
});

describe("writePackageReport", () => {
  it("rejects rather than overwriting an existing report", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "ai-link-packager-report-"));
    try {
      const reportPath = path.join(tempDir, "package-report.csv");
      await writeFile(reportPath, "existing", "utf8");

      await expect(writePackageReport([], reportPath)).rejects.toMatchObject({ code: "EEXIST" });
      await expect(readFile(reportPath, "utf8")).resolves.toBe("existing");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
