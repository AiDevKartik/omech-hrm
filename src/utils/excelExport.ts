/**
 * Excel Export Utilities using SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';

export function exportToExcel(data: Record<string, unknown>[], fileName: string, sheetName = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportMultipleSheetsToExcel(
  sheets: { name: string; data: Record<string, unknown>[] }[],
  fileName: string
) {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
