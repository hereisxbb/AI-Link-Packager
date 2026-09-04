import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { packageAiFiles } from "../../src/core/packageRun";
import type { IllustratorRunResult } from "../../src/adapters/illustrator/windowsAutomation";
import type { AiFileEntry, PackageReportRow } from "../../src/core/types";

describe("packageAiFiles", () => {
  it("prepares, runs Illustrator, and writes the CSV report in one call", async () => {
    const outputRoot = path.join(tmpdir(), `ai-link-packager-test-${Date.now()}`);
    const sourceAiPath = path.join(outputRoot, "source", "poster.ai");
    await mkdir(outputRoot, { recursive: true });
    await mkdir(path.dirname(sourceAiPath), { recursive: true });
    await writeFile(sourceAiPath, "source ai", "utf8");
    const aiFiles: AiFileEntry[] = [
      {
        path: sourceAiPath,
        name: "poster.ai",
        modifiedAt: "2026-05-02T00:00:00.000Z",
        sizeBytes: 1024
      }
    ];

    const result = await packageAiFiles(
      { aiFiles, outputRoot, limit: 1 },
      {
        runIllustratorJsx: async () => ({
          mode: "automated",
          message: "done",
          stdout: "",
          stderr: ""
        } satisfies IllustratorRunResult),
        waitForReportJsonl: async (reportJsonlPath) => {
          const row: PackageReportRow = {
            aiPath: aiFiles[0].path,
            status: "success",
            linkCount: 2,
            foundLinkCount: 2,
            missingLinkCount: 0,
            missingPaths: [],
            outputDir: path.join(outputRoot, "poster"),
            errorMessage: ""
          };
          await writeFile(reportJsonlPath, `${JSON.stringify(row)}\n`, "utf8");
        }
      }
    );

    const csv = await readFile(result.csvReportPath, "utf8");
    expect(result.prepared.jobCount).toBe(1);
    expect(result.run.mode).toBe("automated");
    expect(result.rows).toHaveLength(1);
    expect(csv).toContain("poster.ai");
  });

  it("uses a user supplied run folder name without overwriting an existing folder", async () => {
    const outputRoot = path.join(tmpdir(), `ai-link-packager-named-run-${Date.now()}`);
    const sourceAiPath = path.join(outputRoot, "source", "poster.ai");
    await mkdir(path.dirname(sourceAiPath), { recursive: true });
    await writeFile(sourceAiPath, "source ai", "utf8");
    await mkdir(path.join(outputRoot, "交付源文件"), { recursive: true });

    const result = await packageAiFiles(
      {
        aiFiles: [
          {
            path: sourceAiPath,
            name: "poster.ai",
            modifiedAt: "2026-05-02T00:00:00.000Z",
            sizeBytes: 1024
          }
        ],
        outputRoot,
        runName: "交付源文件"
      },
      {
        runIllustratorJsx: async () => ({
          mode: "automated",
          message: "done",
          stdout: "",
          stderr: ""
        }),
        waitForReportJsonl: async (reportJsonlPath) => {
          const row: PackageReportRow = {
            aiPath: sourceAiPath,
            status: "success",
            linkCount: 1,
            foundLinkCount: 1,
            missingLinkCount: 0,
            missingPaths: [],
            outputDir: path.join(outputRoot, "交付源文件_2", "poster"),
            errorMessage: ""
          };
          await writeFile(reportJsonlPath, `${JSON.stringify(row)}\n`, "utf8");
        }
      }
    );

    expect(result.prepared.runRoot).toBe(path.join(outputRoot, "交付源文件_2"));
  });

  it("fails clearly when Illustrator returns but no report is produced", async () => {
    const outputRoot = path.join(tmpdir(), `ai-link-packager-missing-report-${Date.now()}`);
    const sourceAiPath = path.join(outputRoot, "source", "missing-report.ai");
    await mkdir(outputRoot, { recursive: true });
    await mkdir(path.dirname(sourceAiPath), { recursive: true });
    await writeFile(sourceAiPath, "source ai", "utf8");

    await expect(
      packageAiFiles(
        {
          aiFiles: [
            {
              path: sourceAiPath,
              name: "missing-report.ai",
              modifiedAt: "2026-05-02T00:00:00.000Z",
              sizeBytes: 1024
            }
          ],
          outputRoot
        },
        {
          runIllustratorJsx: async () => ({
            mode: "automated",
            message: "started",
            stdout: "",
            stderr: ""
          }),
          waitForReportJsonl: async () => {
            throw new Error("Timed out waiting for Illustrator report");
          }
        }
      )
    ).rejects.toThrow("Timed out waiting for Illustrator report");
  });
});
