# AI Link Packager v0.1.2

This release fixes packaging for Illustrator documents that contain embedded or otherwise unlinked placed items.

## Fixed

- Prevents the whole packaging job from failing when Illustrator throws while reading `placedItem.file`.
- Embedded/unlinked placed items are skipped safely while external linked assets continue to be collected.
- Packaged `.ai` copies can continue to the Save As step instead of leaving only a `Links` folder behind.
- Adds a regression test for mixed linked and embedded placed-item handling.

## Notes

- Windows 10 / 11
- Adobe Illustrator is required.
- Portable and Setup builds are unsigned, so Windows SmartScreen may show a warning.
