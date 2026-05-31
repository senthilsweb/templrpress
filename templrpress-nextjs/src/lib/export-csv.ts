/**
 * Utility to export tabular data as a CSV file download.
 */

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface ExportCSVOptions {
  filename?: string;
  headers?: string[];
  keys?: string[];
}

export function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  opts: ExportCSVOptions = {}
): void {
  if (!rows.length) return;

  const keys = opts.keys ?? opts.headers ?? Object.keys(rows[0]);
  const headers = opts.headers ?? keys;
  const filename = opts.filename ?? "export";

  const csvLines: string[] = [];
  csvLines.push(headers.map(escapeCSV).join(","));

  for (const row of rows) {
    const line = keys.map((key) => escapeCSV(row[key] as string | number)).join(",");
    csvLines.push(line);
  }

  const csvContent = csvLines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
