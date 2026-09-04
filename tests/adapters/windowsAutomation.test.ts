import { describe, expect, it } from "vitest";
import { buildIllustratorDetectionCommand, buildPowerShellAutomationCommand } from "../../src/adapters/illustrator/windowsAutomation";

describe("buildPowerShellAutomationCommand", () => {
  it("quotes JSX paths with spaces and calls Illustrator COM", () => {
    const command = buildPowerShellAutomationCommand("F:\\输出 目录\\runner.jsx");

    expect(command).toContain("Illustrator.Application");
    expect(command).toContain("Get-Content");
    expect(command).toContain("DoJavaScript");
    expect(command).toContain("F:\\输出 目录\\runner.jsx");
  });

  it("escapes single quotes in PowerShell literal paths", () => {
    const command = buildPowerShellAutomationCommand("F:\\O'Hara\\runner.jsx");

    expect(command).toContain("'F:\\O''Hara\\runner.jsx'");
  });
});


describe("buildIllustratorDetectionCommand", () => {
  it("checks the Illustrator COM registration without assuming an install drive", () => {
    const command = buildIllustratorDetectionCommand();

    expect(command).toContain("HKEY_CLASSES_ROOT\\Illustrator.Application\\CLSID");
    expect(command).toContain("CLSID");
    expect(command).not.toContain("C:\\Program Files");
    expect(command).not.toContain("D:\\");
  });
});
