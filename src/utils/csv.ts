/**
 * Sanitizes a field value for CSV export to prevent CSV / Formula Injection attacks (OWASP).
 *
 * Spreadsheet software (Excel, Google Sheets, LibreOffice Calc) treats fields starting with
 * '=', '+', '-', '@', '\t', or '\r' as formulas or commands.
 * Prepending an apostrophe (') forces the spreadsheet application to treat the cell contents as text.
 */
export function sanitizeCsvField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val);

  if (typeof val === "string") {
    // Check if the string starts with executable formula characters
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
  }

  // Escape double quotes by doubling them per RFC 4180
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}
