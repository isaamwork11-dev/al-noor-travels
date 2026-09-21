type CellValue = string | number;

/** Escape a value for CSV so commas, quotes and newlines survive Excel. */
function cell(value: CellValue): string {
  const raw = String(value ?? "");
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Build and download a CSV file. Opens perfectly in Excel. BOM is prepended
 * so Urdu/other non-ASCII text shows correctly.
 */
export function exportCSV(filename: string, headers: string[], rows: CellValue[][]) {
  const lines = [headers.map(cell).join(",")];
  for (const row of rows) lines.push(row.map(cell).join(","));
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}