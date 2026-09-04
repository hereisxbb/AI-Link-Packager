import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type IllustratorRunMode = "automated" | "manual_required" | "not_installed";

export interface IllustratorRunResult {
  mode: IllustratorRunMode;
  message: string;
  stdout: string;
  stderr: string;
}

export type IllustratorDetectionStatus = "available" | "not_detected" | "unsupported";

export interface IllustratorDetectionResult {
  status: IllustratorDetectionStatus;
  message: string;
  clsid?: string;
}

export function buildIllustratorDetectionCommand(): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    "$key = 'Registry::HKEY_CLASSES_ROOT\\Illustrator.Application\\CLSID'",
    "if (-not (Test-Path -LiteralPath $key)) { exit 3 }",
    "$item = Get-Item -LiteralPath $key",
    "$clsid = $item.GetValue('')",
    "if (-not $clsid) { exit 4 }",
    "Write-Output $clsid"
  ].join("; ");
}

export async function detectIllustrator(): Promise<IllustratorDetectionResult> {
  if (process.platform !== "win32") {
    return {
      status: "unsupported",
      message: "Illustrator 自动化仅支持 Windows。"
    };
  }

  try {
    const result = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", buildIllustratorDetectionCommand()],
      { windowsHide: true, timeout: 10_000, maxBuffer: 256 * 1024 }
    );
    const clsid = result.stdout.trim();
    return {
      status: "available",
      message: "已检测到 Adobe Illustrator",
      clsid: clsid || undefined
    };
  } catch {
    return {
      status: "not_detected",
      message: "未检测到 Adobe Illustrator。请确认 Illustrator 已正常安装。"
    };
  }
}

function psSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function looksLikeIllustratorIsMissing(output: string): boolean {
  return /80040154|REGDB_E_CLASSNOTREG|class not registered|cannot create activex component/i.test(output);
}

export function buildPowerShellAutomationCommand(jsxPath: string): string {
  const quotedJsx = psSingleQuote(jsxPath);

  return [
    "$ErrorActionPreference = 'Stop'",
    `$jsx = ${quotedJsx}`,
    "if (-not (Test-Path -LiteralPath $jsx)) { throw \"JSX file not found: $jsx\" }",
    "$code = Get-Content -LiteralPath $jsx -Raw -Encoding UTF8",
    "$app = New-Object -ComObject Illustrator.Application",
    "$app.DoJavaScript($code)"
  ].join("; ");
}

export async function runIllustratorJsx(jsxPath: string): Promise<IllustratorRunResult> {
  if (process.platform !== "win32") {
    return {
      mode: "not_installed",
      message: "Windows Illustrator automation is only available on Windows in this MVP.",
      stdout: "",
      stderr: ""
    };
  }

  const command = buildPowerShellAutomationCommand(jsxPath);

  try {
    const result = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      {
        windowsHide: true,
        timeout: 60 * 60 * 1000,
        maxBuffer: 1024 * 1024
      }
    );

    return {
      mode: "automated",
      message: "Illustrator automation ran the JSX runner.",
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const stderr = err.stderr ?? err.message ?? "";
    const stdout = err.stdout ?? "";
    const combined = `${stdout}\n${stderr}`;

    if (looksLikeIllustratorIsMissing(combined)) {
      return {
        mode: "not_installed",
        message: "Adobe Illustrator COM automation is not registered on this Windows machine.",
        stdout,
        stderr
      };
    }

    return {
      mode: "manual_required",
      message: "Automatic Illustrator COM execution failed. Illustrator may not have accepted the generated JSX runner.",
      stdout,
      stderr
    };
  }
}
