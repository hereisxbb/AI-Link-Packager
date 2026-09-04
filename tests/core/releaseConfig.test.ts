import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Windows release configuration", () => {
  it("builds both installer and portable Windows executables", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    const targets = pkg.build.win.target.map((entry: { target: string }) => entry.target);

    expect(pkg.scripts["dist:win"]).toContain("electron-builder");
    expect(pkg.scripts["dist:win"]).toContain("--publish never");
    expect(pkg.devDependencies["electron-builder"]).toBeTruthy();
    expect(targets).toContain("nsis");
    expect(targets).toContain("portable");
  });

  it("has a tag-triggered GitHub release workflow", () => {
    const workflow = fs.readFileSync(path.resolve(".github/workflows/release-windows.yml"), "utf8");

    expect(workflow).toContain('tags:');
    expect(workflow).toContain('"v*"');
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run typecheck");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npm run dist:win");
    expect(workflow).toContain("softprops/action-gh-release@v2");
    expect(workflow).toContain("release/AI Link Packager-Setup-*.exe");
    expect(workflow).toContain("release/AI Link Packager-Portable-*.exe");
    expect(workflow).not.toContain("release/*.yml");
    expect(workflow).not.toContain("release/*.blockmap");
    expect(workflow).not.toContain("release/win-unpacked");
  });
});
