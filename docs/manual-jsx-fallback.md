# Manual JSX Fallback

Use this when the app cannot automatically run Illustrator scripting through Windows COM.

1. Keep the generated output run folder in place.
2. Open Adobe Illustrator.
3. Choose `File -> Scripts -> Other Script...`.
4. Select `ai_package_runner.jsx` from the run folder.
5. Wait until Illustrator finishes processing the files.
6. Inspect `package_report.jsonl` or generate the CSV report from the app/debug workflow.

The script opens each source AI file, copies linked assets to the output `Links` folder, saves an AI copy in the output project folder, and closes the source document without saving original changes.
