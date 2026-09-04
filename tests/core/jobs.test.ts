import path from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { createPackageJobs, writeJobsJson } from "../../src/core/jobs";
import type { AiFileEntry } from "../../src/core/types";

describe("createPackageJobs", () => {
  it("creates one output folder per ai file without overwriting collisions", async () => {
    const aiFiles: AiFileEntry[] = [
      { path: "F:\\设计\\挑战赛.ai", name: "挑战赛.ai", modifiedAt: "2026-06-01T00:00:00.000Z", sizeBytes: 10 },
      { path: "F:\\其他\\挑战赛.ai", name: "挑战赛.ai", modifiedAt: "2026-06-02T00:00:00.000Z", sizeBytes: 10 }
    ];
    const seen = new Set<string>();

    const jobs = await createPackageJobs(aiFiles, "F:\\输出", async (target) => {
      if (seen.has(target)) return true;
      seen.add(target);
      return false;
    });

    expect(jobs).toHaveLength(2);
    expect(path.basename(jobs[0].outputDir)).toBe("挑战赛");
    expect(path.basename(jobs[1].outputDir)).toBe("挑战赛_2");
    expect(path.basename(jobs[0].outputAiPath)).toBe("挑战赛.ai");
  });

  it("reserves output folders chosen during the same job creation call", async () => {
    const aiFiles: AiFileEntry[] = [
      { path: "F:\\设计\\挑战赛.ai", name: "挑战赛.ai", modifiedAt: "2026-06-01T00:00:00.000Z", sizeBytes: 10 },
      { path: "F:\\其他\\挑战赛.ai", name: "挑战赛.ai", modifiedAt: "2026-06-02T00:00:00.000Z", sizeBytes: 10 }
    ];

    const jobs = await createPackageJobs(aiFiles, "F:\\输出", async () => false);

    expect(path.basename(jobs[0].outputDir)).toBe("挑战赛");
    expect(path.basename(jobs[1].outputDir)).toBe("挑战赛_2");
  });
});

describe("writeJobsJson", () => {
  it("rejects rather than overwriting an existing manifest", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "ai-link-packager-jobs-"));
    try {
      const targetPath = path.join(tempDir, "jobs.json");
      await writeFile(targetPath, "existing", "utf8");

      await expect(writeJobsJson([], targetPath)).rejects.toMatchObject({ code: "EEXIST" });
      await expect(readFile(targetPath, "utf8")).resolves.toBe("existing");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
