import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { detectIllustrator, runIllustratorJsx } from "../src/adapters/illustrator/windowsAutomation";
import { packageAiFiles, preparePackageRun } from "../src/core/packageRun";
import { scanAiFiles } from "../src/core/scanAiFiles";
import { readJsonlReport, writePackageReport } from "../src/reports/csvReport";
import type { AiFileEntry, AiScanOptions } from "../src/core/types";

function rendererIndexPath(): string {
  return path.resolve(__dirname, "..", "..", "dist-renderer", "index.html");
}

app.setAppUserModelId("com.ailinkpackager.desktop");

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(rendererIndexPath());
  }
}

ipcMain.handle("detect-illustrator", async () => detectIllustrator());

ipcMain.handle("select-ai-files", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Adobe Illustrator", extensions: ["ai"] }]
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.canceled ? undefined : result.filePaths[0];
});

ipcMain.handle("scan-ai-files", async (_event, options: AiScanOptions) => {
  return scanAiFiles(options);
});

ipcMain.handle("prepare-run", async (_event, payload: { aiFiles: AiFileEntry[]; outputRoot: string; limit?: number; runName?: string }) => {
  return preparePackageRun(payload);
});

ipcMain.handle("start-run", async (_event, payload: { jsxPath: string }) => {
  return runIllustratorJsx(payload.jsxPath);
});

ipcMain.handle("finalize-report", async (_event, payload: { reportJsonlPath: string; csvReportPath: string }) => {
  const rows = await readJsonlReport(payload.reportJsonlPath);
  await writePackageReport(rows, payload.csvReportPath);
  return payload.csvReportPath;
});

ipcMain.handle("package-run", async (_event, payload: { aiFiles: AiFileEntry[]; outputRoot: string; limit?: number; runName?: string }) => {
  return packageAiFiles(payload);
});

ipcMain.handle("open-output-folder", async (_event, folderPath: string) => {
  return shell.openPath(folderPath);
});

ipcMain.handle("confirm-open-output-folder", async (_event, folderPath: string) => {
  const result = await dialog.showMessageBox({
    type: "info",
    title: "打包完成",
    message: "打包已完成",
    detail: `新文件夹已创建：\n${folderPath}\n\n是否现在打开？`,
    buttons: ["打开新文件夹", "稍后"],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  });

  if (result.response === 0) {
    await shell.openPath(folderPath);
    return true;
  }
  return false;
});

void app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
