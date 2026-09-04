import { describe, expect, it } from "vitest";
import type { PreparedRun } from "../../src/core/types";

describe("PreparedRun contract", () => {
  it("documents the renderer-visible prepared run shape", () => {
    const prepared: PreparedRun = {
      runRoot: "F:\\输出\\ai-link-packager-run-abc123",
      jobsJsonPath: "F:\\输出\\jobs.json",
      jsxPath: "F:\\输出\\runner.jsx",
      reportJsonlPath: "F:\\输出\\package_report.jsonl",
      csvReportPath: "F:\\输出\\package_report.csv",
      jobCount: 1
    };

    expect(prepared.jobCount).toBe(1);
  });
});
