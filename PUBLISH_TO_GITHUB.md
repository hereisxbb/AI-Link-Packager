# Publishing

This project publishes Windows builds through GitHub Releases.

## Verify Locally

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Build Windows Executables Locally

```powershell
npm.cmd run dist:win
```

Generated files are written to `release/`.

## Publish a Version

Push the source first:

```powershell
git push -u origin main
```

Create and push a version tag:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

The `Build Windows Release` GitHub Actions workflow builds and uploads only the installer and portable executables.
