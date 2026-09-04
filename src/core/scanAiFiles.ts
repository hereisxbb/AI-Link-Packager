import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import type { AiFileEntry, AiScanOptions } from "./types";

function normalizeForCompare(input: string): string {
  return path.resolve(input).toLowerCase();
}

function isInsideAny(target: string, roots: string[]): boolean {
  const normalizedTarget = normalizeForCompare(target);
  return roots.some((root) => {
    const normalizedRoot = normalizeForCompare(root);
    return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`);
  });
}

async function collectAiFiles(
  inputPath: string,
  recursive: boolean,
  excludePaths: string[],
  entries: AiFileEntry[]
): Promise<void> {
  if (isInsideAny(inputPath, excludePaths)) return;

  const info = await lstat(inputPath);
  if (info.isSymbolicLink()) return;

  if (info.isFile()) {
    if (path.extname(inputPath).toLowerCase() === ".ai") {
      entries.push({
        path: path.resolve(inputPath),
        name: path.basename(inputPath),
        modifiedAt: info.mtime.toISOString(),
        sizeBytes: info.size
      });
    }
    return;
  }

  if (!info.isDirectory()) return;

  const children = await readdir(inputPath, { withFileTypes: true });
  for (const child of children) {
    if (child.isSymbolicLink()) continue;

    const childPath = path.join(inputPath, child.name);
    if (child.isDirectory() && !recursive) continue;
    await collectAiFiles(childPath, recursive, excludePaths, entries);
  }
}

export async function scanAiFiles(options: AiScanOptions): Promise<AiFileEntry[]> {
  const entries: AiFileEntry[] = [];
  const excludePaths = options.excludePaths.map((item) => path.resolve(item));
  const sinceTime = options.since ? new Date(`${options.since}T00:00:00`).getTime() : undefined;

  for (const inputPath of options.inputPaths) {
    await collectAiFiles(path.resolve(inputPath), options.recursive, excludePaths, entries);
  }

  return entries
    .filter((entry) => sinceTime === undefined || new Date(entry.modifiedAt).getTime() >= sinceTime)
    .sort((a, b) => a.path.localeCompare(b.path, "zh-CN"));
}
