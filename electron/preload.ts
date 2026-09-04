import { contextBridge, ipcRenderer } from "electron";
import type { IllustratorDetectionResult, IllustratorRunResult } from "../src/adapters/illustrator/windowsAutomation";
import type { AiFileEntry, AiScanOptions, PreparedRun } from "../src/core/types";
import type { PackageRunResult } from "../src/core/packageRun";

const api = {
  detectIllustrator: (): Promise<IllustratorDetectionResult> => ipcRenderer.invoke("detect-illustrator"),
  selectAiFiles: (): Promise<string[]> => ipcRenderer.invoke("select-ai-files"),
  selectFolder: (): Promise<string | undefined> => ipcRenderer.invoke("select-folder"),
  scan: (options: AiScanOptions): Promise<AiFileEntry[]> => ipcRenderer.invoke("scan-ai-files", options),
  prepareRun: (payload: { aiFiles: AiFileEntry[]; outputRoot: string; limit?: number; runName?: string }): Promise<PreparedRun> =>
    ipcRenderer.invoke("prepare-run", payload),
  startRun: (payload: { jsxPath: string }): Promise<IllustratorRunResult> => ipcRenderer.invoke("start-run", payload),
  finalizeReport: (payload: { reportJsonlPath: string; csvReportPath: string }): Promise<string> =>
    ipcRenderer.invoke("finalize-report", payload),
  packageRun: (payload: { aiFiles: AiFileEntry[]; outputRoot: string; limit?: number; runName?: string }): Promise<PackageRunResult> =>
    ipcRenderer.invoke("package-run", payload),
  openOutputFolder: (folderPath: string): Promise<string> => ipcRenderer.invoke("open-output-folder", folderPath),
  confirmOpenOutputFolder: (folderPath: string): Promise<boolean> => ipcRenderer.invoke("confirm-open-output-folder", folderPath)
};

contextBridge.exposeInMainWorld("aiLinkPackager", api);

export type AiLinkPackagerApi = typeof api;
