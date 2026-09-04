# AI Link Packager

> Package Adobe Illustrator files and their linked assets in one click.

[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011-0078D4?logo=windows11&logoColor=white)](https://github.com/hereisxbb/AI-Link-Packager)
[![Latest Release](https://img.shields.io/github/v/release/hereisxbb/AI-Link-Packager?label=latest)](https://github.com/hereisxbb/AI-Link-Packager/releases/latest)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Adobe Illustrator](https://img.shields.io/badge/Requires-Adobe%20Illustrator-FF9A00?logo=adobeillustrator&logoColor=white)](https://www.adobe.com/products/illustrator.html)

AI Link Packager is a Windows desktop tool that packages Adobe Illustrator `.ai` files together with the external assets they actually link to. It uses your locally installed Illustrator to read real link data, copies those assets into `Links` folders, relinks the packaged copy, and leaves your original files untouched.

## Preview

<p align="center">
  <img src="docs/app-preview.jpg" alt="AI Link Packager main interface" width="100%">
</p>

<p align="center">
  <em>Add Illustrator files, choose an output folder, and package linked assets without modifying the originals.</em>
</p>

## Download

**Recommended:** [Download the latest Portable release](https://github.com/hereisxbb/AI-Link-Packager/releases/latest) — no installation required.

Also available: a standard Windows Setup installer in the same Release.

> Windows may show a SmartScreen warning because current builds are unsigned.

## Quick Start

1. Open **AI Link Packager**.
2. Add one or more `.ai` files, or select a folder.
3. Choose an output location and folder name.
4. Run a one-file test package first.
5. If the test looks correct, run the full batch.
6. When packaging finishes, open the generated folder and review the report.

## What It Solves

Illustrator documents often reference images, PSDs, TIFFs, logos, and other assets instead of embedding them. Sending only the `.ai` file can leave the recipient with missing links and broken layouts.

AI Link Packager automates the handoff workflow so designers do not have to manually hunt down every linked asset before delivery.

## Features

- Select one or multiple `.ai` files
- Scan folders recursively
- Automatically collect linked assets
- Copy linked assets into `Links` folders
- Relink packaged Illustrator files
- Preserve original AI files
- Batch process multiple Illustrator files
- Custom output folder names
- Packaging reports
- Open output folder after packaging
- Illustrator detection through Windows COM

## Requirements

- Windows 10 / 11
- Adobe Illustrator installed
- Illustrator correctly registered with Windows COM
- Enough free system disk space for Illustrator temporary files

Illustrator can be installed on **any drive**. AI Link Packager does not depend on a fixed Illustrator installation path as long as Windows COM registration is working.

## Output Structure

```text
OutputFolder/
  YourPackageName/
    ProjectName/
      ProjectName.ai
      Links/
        image01.jpg
        background.psd
        logo.png
    package_report.csv
    package_report.jsonl
    runner_debug.txt
```

## How It Works

AI Link Packager does not guess filenames by parsing the `.ai` file directly. Instead, it asks the locally installed Adobe Illustrator application to read `document.placedItems`, then:

1. opens the original Illustrator file,
2. reads its real linked assets,
3. copies found assets into a new `Links` folder,
4. relinks the packaged document to those copied assets,
5. saves a new `.ai` copy into the output folder,
6. writes packaging and debug reports.

The original `.ai` file and original linked assets are not overwritten.

## Packaging Result

After a successful run, AI Link Packager shows how many files were fully packaged, which jobs have missing linked assets, and whether any files failed. From the completion screen you can open the generated package folder directly or start a new packaging run.

## Important Notes

- Original `.ai` files are not overwritten.
- Original linked assets are copied, not moved.
- Existing output folders are given unique names to avoid overwriting.
- Font files are not copied.
- Illustrator may open or move to the foreground while packaging.
- Current public builds are unsigned, so Windows SmartScreen may show a warning.

## Troubleshooting

### Illustrator crashes while saving

Check free space on your **system drive (usually C:)** first. Illustrator can use substantial temporary disk space even when both source and output files are stored on another drive.

For large AI files, keeping at least **15–20 GB free** on the system drive is recommended.

### Packaging fails

Check these generated files in the output folder:

- `package_report.csv`
- `package_report.jsonl`
- `runner_debug.txt`

They are the most useful files to attach when reporting a bug.

### Illustrator is not detected

Make sure Illustrator is installed normally, has been opened at least once, and is correctly registered with Windows. Its installation drive does not matter.

## Feedback

Found a bug or have an idea? [Open a GitHub Issue](https://github.com/hereisxbb/AI-Link-Packager/issues).

For bug reports, please include as much of the following as possible:

- Windows version
- Illustrator version
- AI Link Packager version
- Number of AI files
- Approximate number of linked assets
- Error message
- `runner_debug.txt`
- Screenshots

## Roadmap

- Drag and drop
- Real-time per-file packaging progress
- Better error diagnostics
- Packaging history
- Auto update
- More Illustrator compatibility testing

## Development

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev:electron
```

PowerShell may block `npm.ps1` on some Windows systems. If that happens, use `npm.cmd` instead.

## Build

Build Windows executables:

```powershell
npm run dist:win
```

Generated files are written to `release/`.

The release workflow produces both:

- `AI Link Packager-Portable-<version>-x64.exe`
- `AI Link Packager-Setup-<version>-x64.exe`

## License

MIT License. See [LICENSE](LICENSE).
