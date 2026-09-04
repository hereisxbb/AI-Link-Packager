import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { sanitizeProjectName, uniqueChildPath } from "./safeNames";
import type { AiFileEntry, PackageJob } from "./types";

export type ExistsFn = (targetPath: string) => Promise<boolean>;

async function defaultExists(targetPath: string): Promise<boolean> {
  try {
    await import("node:fs/promises").then((fs) => fs.access(targetPath));
    return true;
  } catch {
    return false;
  }
}

export async function createPackageJobs(
  aiFiles: AiFileEntry[],
  outputRoot: string,
  exists: ExistsFn = defaultExists
): Promise<PackageJob[]> {
  const jobs: PackageJob[] = [];
  const reservedOutputDirs = new Set<string>();

  for (const aiFile of aiFiles) {
    const projectName = sanitizeProjectName(aiFile.name);
    const outputDir = await uniqueChildPath(outputRoot, projectName, async (targetPath) => {
      return reservedOutputDirs.has(path.resolve(targetPath)) || await exists(targetPath);
    });
    reservedOutputDirs.add(path.resolve(outputDir));
    const linksDir = path.join(outputDir, "Links");
    const outputAiPath = path.join(outputDir, `${projectName}.ai`);

    jobs.push({
      id: Buffer.from(`${aiFile.path}|${outputDir}`, "utf8").toString("base64url"),
      aiPath: aiFile.path,
      projectName,
      outputDir,
      linksDir,
      outputAiPath
    });
  }

  return jobs;
}

export async function writeJobsJson(jobs: PackageJob[], targetPath: string): Promise<void> {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify({ jobs }, null, 2), { encoding: "utf8", flag: "wx" });
}
