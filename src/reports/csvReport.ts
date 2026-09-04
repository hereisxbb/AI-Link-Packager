import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PackageReportRow } from "../core/types";

const headers = [
  "ai_path",
  "status",
  "link_count",
  "found_link_count",
  "missing_link_count",
  "missing_paths",
  "output_dir",
  "error_message"
];

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function toCsv(rows: PackageReportRow[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push([
      row.aiPath,
      row.status,
      row.linkCount,
      row.foundLinkCount,
      row.missingLinkCount,
      row.missingPaths.join("; "),
      row.outputDir,
      row.errorMessage
    ].map(escapeCsv).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export async function writePackageReport(rows: PackageReportRow[], reportPath: string): Promise<void> {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, toCsv(rows), { encoding: "utf8", flag: "wx" });
}

export async function readJsonlReport(reportJsonlPath: string): Promise<PackageReportRow[]> {
  const text = await readFile(reportJsonlPath, "utf8");
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as PackageReportRow);
}
