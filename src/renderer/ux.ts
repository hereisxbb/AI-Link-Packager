export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const digits = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(digits).replace(/\.0$/, "")} ${units[index]}`;
}

export function summarizePackageRows(rows: Array<{ status: "success" | "partial_success" | "failed" }>) {
  return rows.reduce(
    (summary, row) => {
      summary.total += 1;
      if (row.status === "success") summary.success += 1;
      if (row.status === "partial_success") summary.partial += 1;
      if (row.status === "failed") summary.failed += 1;
      return summary;
    },
    { success: 0, partial: 0, failed: 0, total: 0 }
  );
}
