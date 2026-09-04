# AI Link Packager

A Windows desktop tool for automatically packaging Adobe Illustrator files with their linked assets.

## Overview

AI Link Packager helps designers and production teams deliver Adobe Illustrator `.ai` source files together with the external image assets they reference.

It does not guess linked asset names by parsing Illustrator files directly. Instead, it asks the locally installed Adobe Illustrator application to read the real `document.placedItems` link data through Illustrator scripting.

## Why I Built This

Illustrator files often use linked images instead of embedded images. Sending only the `.ai` file can leave the recipient with missing images, broken layouts, and a lot of manual cleanup.

This app was built to make that handoff safer: choose Illustrator files, choose an output folder, and create delivery folders that include the `.ai` copy, a `Links` folder, and a packaging report.

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

## Requirements

- Windows 10 / 11
- Adobe Illustrator installed
- Illustrator must be correctly registered with Windows COM
- Enough free system disk space

Illustrator can be installed on any drive. AI Link Packager does not depend on a fixed Illustrator installation path as long as Windows COM registration is working.

## Download

Download the latest version from GitHub Releases.

Recommended:

**AI Link Packager Portable**

No installation required.

## How To Use

1. Launch AI Link Packager.
2. Select one or more `.ai` files, or select a folder and scan recursively.
3. Choose an output folder.
4. Run a one-file test package first.
5. If the test looks correct, run the batch package.
6. Zip or share the generated project folders.

## Output Structure

```text
OutputFolder/
  ai-link-packager-run-xxxxxx/
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

## Important Notes

- Original `.ai` files are not overwritten.
- Original linked assets are copied, not moved.
- Existing output folders are given unique names to avoid overwriting.
- Font files are not copied.
- The app uses Illustrator automation, so Illustrator may open during packaging.

## Known Limitations

- Windows only
- Requires Adobe Illustrator
- Unsigned builds may trigger Windows SmartScreen
- Very low system disk space may cause Illustrator to crash while saving large packaged files

## Troubleshooting

If Illustrator crashes while saving a packaged file, first check free space on the system drive.

For large AI files, keep at least 15-20 GB free on the system drive.

If packaging fails, check the generated `package_report.csv` and `runner_debug.txt` files in the output run folder.

## Feedback

Please open a GitHub Issue if you find a bug or have a feature request.

For bug reports, include as much of the following as possible:

- Windows version
- Illustrator version
- App version
- Number of AI files
- Approximate number of linked assets
- Error message
- `runner_debug.txt`
- Screenshots

## Roadmap

- Drag and drop
- Real-time packaging progress
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

Build Windows executable:

```powershell
npm run dist:win
```

Generated files are written to `release/`.

## License

MIT License. See [LICENSE](LICENSE).
