// Excel Export using SheetJS
import * as XLSX from 'xlsx';
import type { TableData } from './types';

/**
 * Convert table data to Excel Blob
 */
export function toExcelBlob(data: TableData, sheetName: string = 'Sheet1'): Blob {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
    });

    // Create and return Blob
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
}

/**
 * Download Excel file
 */
export function downloadExcel(data: TableData, filename: string = 'table.xlsx'): void {
    const blob = toExcelBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Read Excel file to TableData
 */
export function readExcel(buffer: ArrayBuffer): TableData {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // header: 1 returns array of arrays [["a", "b"], [1, 2]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Convert all cells to strings and ensure TableData consistency
    return jsonData.map(row => {
        // Ensure row is an array (sometimes sheet_to_json returns sparse stuff?)
        if (!Array.isArray(row)) return [];
        return row.map(cell =>
            cell === null || cell === undefined ? '' : String(cell)
        );
    }).filter(row => row.length > 0);
}
