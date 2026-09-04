import path from "node:path";

const invalidWindowsChars = /[<>:"/\\|?*\u0000-\u001f]/g;
const trailingDotsSpacesOrUnderscores = /[. _]+$/g;

function isInsideParent(parentDir: string, targetPath: string): boolean {
  const relativePath = path.relative(path.resolve(parentDir), path.resolve(targetPath));
  return relativePath.length === 0 || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

export function sanitizeProjectName(input: string): string {
  const withoutAiExtension = input.replace(/\.ai$/i, "");
  const cleaned = withoutAiExtension
    .replace(invalidWindowsChars, "_")
    .replace(/\s+/g, " ")
    .replace(trailingDotsSpacesOrUnderscores, "")
    .trim();

  return cleaned.length > 0 ? cleaned : "untitled-ai";
}

export function sanitizeFolderName(input: string): string {
  const cleaned = input
    .replace(invalidWindowsChars, "_")
    .replace(/\s+/g, " ")
    .replace(trailingDotsSpacesOrUnderscores, "")
    .trim();

  return cleaned.length > 0 ? cleaned : "AI打包文件";
}

export async function uniqueChildPath(
  parentDir: string,
  desiredName: string,
  exists: (targetPath: string) => Promise<boolean>
): Promise<string> {
  const childName = path.basename(desiredName);
  const parsed = path.parse(childName);
  let candidate = path.join(parentDir, childName);
  let index = 2;

  if (!isInsideParent(parentDir, candidate)) {
    throw new Error(`Generated child path escapes parent directory: ${desiredName}`);
  }

  while (await exists(candidate)) {
    candidate = path.join(parentDir, `${parsed.name}_${index}${parsed.ext}`);
    if (!isInsideParent(parentDir, candidate)) {
      throw new Error(`Generated child path escapes parent directory: ${desiredName}`);
    }
    index += 1;
  }

  return candidate;
}
