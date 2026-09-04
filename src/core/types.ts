export type PackageStatus = "success" | "partial_success" | "failed";

export interface AiScanOptions {
  inputPaths: string[];
  recursive: boolean;
  since?: string;
  excludePaths: string[];
}

export interface AiFileEntry {
  path: string;
  name: string;
  modifiedAt: string;
  sizeBytes: number;
}

export interface PackageJob {
  id: string;
  aiPath: string;
  projectName: string;
  outputDir: string;
  linksDir: string;
  outputAiPath: string;
}

export interface PackageReportRow {
  aiPath: string;
  status: PackageStatus;
  linkCount: number;
  foundLinkCount: number;
  missingLinkCount: number;
  missingPaths: string[];
  outputDir: string;
  errorMessage: string;
}

export interface PreparedRun {
  runRoot: string;
  jobsJsonPath: string;
  jsxPath: string;
  reportJsonlPath: string;
  csvReportPath: string;
  jobCount: number;
}
