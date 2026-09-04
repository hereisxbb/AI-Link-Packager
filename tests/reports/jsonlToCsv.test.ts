import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readJsonlReport } from "../../src/reports/csvReport";

describe("readJsonlReport", () => {
  it("reads Illustrator JSON lines into report rows", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `ai-report-${Date.now()}`), { recursive: true });
    if (!root) throw new Error("failed to create temp root");
    const report = path.join(root, "package_report.jsonl");
    await writeFile(
      report,
      "{\"aiPath\":\"F:\\\\a.ai\",\"status\":\"success\",\"linkCount\":0,\"foundLinkCount\":0,\"missingLinkCount\":0,\"missingPaths\":[],\"outputDir\":\"F:\\\\out\",\"errorMessage\":\"\"}\r\n",
      "utf8"
    );

    const rows = await readJsonlReport(report);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("success");
  });
});
