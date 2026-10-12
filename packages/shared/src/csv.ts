/**
 * CSV Export & Cell Neutralisation Helper (T7.11 / SC-H2)
 * Ensures CSV formula injection characters (=, +, -, @, \t, \r) are neutralised.
 */

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  // If the cell begins with formula injection prefix (=, +, -, @, \t, \r), prefix with a single quote
  let safeStr = str;
  if (/^[=+\-@\t\r]/.test(safeStr)) {
    safeStr = `'${safeStr}`;
  }

  // If the cell contains quotes, commas, or newlines, enclose in double quotes and escape internal quotes
  if (/[",\n\r]/.test(safeStr)) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }
  return safeStr;
}

export function generateCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(sanitizeCsvCell).join(",")).join("\r\n");
}
