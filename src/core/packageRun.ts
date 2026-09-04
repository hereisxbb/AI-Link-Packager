import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateIllustratorRunnerJsx } from "../adapters/illustrator/jsxGenerator";
import { runIllustratorJsx, type IllustratorRunResult } from "../adapters/illustrator/windowsAutomation";
import { readJsonlReport, writePackageReport } from "../reports/csvReport";
import { createPackageJobs, writeJobsJson } from "./jobs";
import { sanitizeFolderName, uniqueChildPath } from "./safeNames";
import type { AiFileEntry, PackageReportRow, PreparedRun } from "./types";

export interface PreparePackageRunInput {
  aiFiles: AiFileEntry[];
  outputRoot: string;
  limit?: number;
  runName?: string;
}

export interface PackageRunResult {
  prepared: PreparedRun;
  run: IllustratorRunResult;
  rows: PackageReportRow[];
  csvReportPath: string;
}

export interface PackageRunDependencies {
  runIllustratorJsx?: (jsxPath: string) => Promise<IllustratorRunResult>;
  waitForReportJsonl?: (reportJsonlPath: string, expectedRows: number) => Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function countJsonlRows(reportJsonlPath: string): Promise<number> {
  const text = await readFile(reportJsonlPath, "utf8");
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

export async function waitForReportJsonl(
  reportJsonlPath: string,
  expectedRows: number,
  options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 60 * 60 * 1000;
  const intervalMs = options.intervalMs ?? 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await fileExists(reportJsonlPath)) {
      const rows = await countJsonlRows(reportJsonlPath);
      if (rows >= expectedRows) return;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for Illustrator report: ${reportJsonlPath}`);
}

export async function preparePackageRun(input: PreparePackageRunInput): Promise<PreparedRun> {
  if (input.aiFiles.length === 0) {
    throw new Error("No AI files selected.");
  }
  if (!input.outputRoot) {
    throw new Error("No output folder selected.");
  }

  await mkdir(input.outputRoot, { recursive: true });
  let runRoot: string;
  if (input.runName && input.runName.trim().length > 0) {
    const desiredName = sanitizeFolderName(input.runName);
    runRoot = await uniqueChildPath(input.outputRoot, desiredName, fileExists);
    await mkdir(runRoot, { recursive: false });
  } else {
    runRoot = await mkdtemp(path.join(input.outputRoot, "ai-link-packager-run-"));
  }

  const selected = typeof input.limit === "number" ? input.aiFiles.slice(0, input.limit) : input.aiFiles;
  const jobs = await createPackageJobs(selected, runRoot);

  const jobsJsonPath = path.join(runRoot, "jobs.json");
  const reportJsonlPath = path.join(runRoot, "package_report.jsonl");
  const csvReportPath = path.join(runRoot, "package_report.csv");
  const jsxPath = path.join(runRoot, "ai_package_runner.jsx");

  await writeJobsJson(jobs, jobsJsonPath);
  await writeFile(jsxPath, generateIllustratorRunnerJsx({ jobsJsonPath, reportJsonlPath }), {
    encoding: "utf8",
    flag: "wx"
  });

  return { runRoot, jobsJsonPath, jsxPath, reportJsonlPath, csvReportPath, jobCount: jobs.length };
}


export async function packageAiFiles(
  input: PreparePackageRunInput,
  dependencies: PackageRunDependencies = {}
): Promise<PackageRunResult> {
  const prepared = await preparePackageRun(input);
  const run = await (dependencies.runIllustratorJsx ?? runIllustratorJsx)(prepared.jsxPath);

  if (run.mode !== "automated") {
    throw new Error(run.message);
  }

  await (dependencies.waitForReportJsonl ?? waitForReportJsonl)(prepared.reportJsonlPath, prepared.jobCount);

  const rows = await readJsonlReport(prepared.reportJsonlPath);
  await writePackageReport(rows, prepared.csvReportPath);

  return {
    prepared,
    run,
    rows,
    csvReportPath: prepared.csvReportPath
  };
}
