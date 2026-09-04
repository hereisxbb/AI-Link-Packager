import { describe, expect, it } from "vitest";
import { generateIllustratorRunnerJsx } from "../../src/adapters/illustrator/jsxGenerator";

describe("generateIllustratorRunnerJsx", () => {
  it("embeds escaped Windows paths and core Illustrator operations", () => {
    const jsx = generateIllustratorRunnerJsx({
      jobsJsonPath: "F:\\输出\\jobs.json",
      reportJsonlPath: "F:\\输出\\package_report.jsonl"
    });

    expect(jsx).toContain("document.placedItems");
    expect(jsx).toContain("relink");
    expect(jsx).toContain("source.displayName || source.name");
    expect(jsx).toContain("package_report.jsonl");
    expect(jsx).toContain("F:/输出/jobs.json");
  });

  it("opens the original AI before resolving links, then saves a packaged copy", () => {
    const jsx = generateIllustratorRunnerJsx({
      jobsJsonPath: "F:\\输出\\jobs.json",
      reportJsonlPath: "F:\\输出\\package_report.jsonl"
    });

    expect(jsx).toContain("sameFile(outputFile, sourceFile)");
    expect(jsx).toContain("Output AI path matches source AI path");
    expect(jsx).toContain("app.open(sourceFile)");
    expect(jsx).toContain("doc.saveAs(outputFile)");
    expect(jsx).not.toContain("app.open(outputFile)");
    expect(jsx).not.toContain("sourceFile.copy(outputFile)");
  });

  it("reports copy and relink failures without counting them as missing links", () => {
    const jsx = generateIllustratorRunnerJsx({
      jobsJsonPath: "F:\\输出\\jobs.json",
      reportJsonlPath: "F:\\输出\\package_report.jsonl"
    });

    expect(jsx).toContain("var packageErrors = [];");
    expect(jsx).toContain("packageErrors.push");
    expect(jsx).toContain('missing.length > 0 || packageErrors.length > 0 ? "partial_success"');
    expect(jsx).toContain("packageErrors.join");
  });

  it("suppresses Illustrator modal alerts while the runner opens documents", () => {
    const jsx = generateIllustratorRunnerJsx({
      jobsJsonPath: "F:\\输出\\jobs.json",
      reportJsonlPath: "F:\\输出\\package_report.jsonl"
    });

    expect(jsx).toContain("app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS");
  });

  it("writes a fatal report row if the runner fails before processing jobs", () => {
    const jsx = generateIllustratorRunnerJsx({
      jobsJsonPath: "F:\\输出\\jobs.json",
      reportJsonlPath: "F:\\输出\\package_report.jsonl"
    });

    expect(jsx).toContain('status: "failed"');
    expect(jsx).toContain('aiPath: "[runner]"');
    expect(jsx).toContain("Fatal runner error");
  });

  it("does not require native JSON support in Illustrator ExtendScript", () => {
    const jsx = generateIllustratorRunnerJsx({
      jobsJsonPath: "F:\\输出\\jobs.json",
      reportJsonlPath: "F:\\输出\\package_report.jsonl"
    });

    expect(jsx).not.toContain("JSON.parse");
    expect(jsx).not.toContain("JSON.stringify");
    expect(jsx).toContain("parsePayload");
    expect(jsx).toContain("reportRowToJson");
  });

  it("writes a debug trace beside the report while processing", () => {
    const jsx = generateIllustratorRunnerJsx({
      jobsJsonPath: "F:\\输出\\jobs.json",
      reportJsonlPath: "F:\\输出\\package_report.jsonl"
    });

    expect(jsx).toContain("runner_debug.txt");
    expect(jsx).toContain("debugLog");
    expect(jsx).toContain("open source document");
    expect(jsx).toContain("save packaged document");
  });
});
