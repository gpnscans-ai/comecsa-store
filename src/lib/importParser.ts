import ExcelJS from "exceljs";

// Convierte un archivo subido (.xlsx/.xls/.csv) en filas de texto, indexadas
// por el encabezado de columna normalizado (minúsculas, sin tildes, sin espacios).
export async function parseSpreadsheet(buffer: Buffer, filename: string): Promise<Record<string, string>[]> {
  const isCsv = filename.toLowerCase().endsWith(".csv");

  if (isCsv) {
    return parseCsv(buffer.toString("utf-8"));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = normalizeHeader(String(cell.value ?? ""));
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headers[colNumber];
      if (!key) return;
      const value = cellToString(cell.value);
      if (value) hasValue = true;
      obj[key] = value;
    });
    if (hasValue) rows.push(obj);
  });

  return rows;
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "text" in (value as any)) return String((value as any).text ?? "");
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const splitLine = (line: string) => {
    // Soporta comas o punto y coma como separador, y campos entre comillas.
    const delimiter = line.includes(";") && !line.includes(",") ? ";" : ",";
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map(normalizeHeader);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const obj: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((h, idx) => {
      const v = (values[idx] || "").trim();
      if (v) hasValue = true;
      obj[h] = v;
    });
    if (hasValue) rows.push(obj);
  }

  return rows;
}

// Busca el primer valor no vacío entre varios posibles nombres de columna
// (para aceptar encabezados en español/inglés y variantes comunes).
export function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

export function toBool(value: string, defaultValue = true): boolean {
  if (!value) return defaultValue;
  const v = value.toLowerCase().trim();
  return ["si", "sí", "yes", "true", "1", "x"].includes(v);
}

export function toNumber(value: string, defaultValue = 0): number {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : defaultValue;
}
