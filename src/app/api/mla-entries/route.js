import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

const DEFAULT_MLA_DIR = '/mlas/west-bengal';
export const dynamic = 'force-dynamic';

function normalizePhotoPath(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const trimmed = fileName.trim().replaceAll('\\', '/');

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (trimmed.includes('/')) {
    return `/${trimmed}`;
  }

  return `${DEFAULT_MLA_DIR}/${trimmed}`;
}

function getCell(row, keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim()) {
      return String(row[key]).trim();
    }
  }
  return '';
}

function normalizeRowKeys(row) {
  const normalized = {};

  for (const [key, value] of Object.entries(row)) {
    const plainKey = String(key).toLowerCase().replace(/[\s_-]+/g, '');
    normalized[plainKey] = value;
  }

  return normalized;
}

function isHeaderRow(cells) {
  const joined = cells
    .map((cell) => String(cell || '').toLowerCase().trim())
    .join(' ');

  return /(file|filename|photo|image|text|headline|name|candidate|mla)/.test(joined);
}

function rowsFromMatrix(matrixRows) {
  if (!Array.isArray(matrixRows) || matrixRows.length === 0) {
    return [];
  }

  const startIndex = isHeaderRow(matrixRows[0]) ? 1 : 0;
  return matrixRows
    .slice(startIndex)
    .map((cells) => {
      const fileName = String(cells[0] || '').trim();
      const text = String(cells[1] || '').trim();
      const name = String(cells[2] || '').trim();
      const photoPath = normalizePhotoPath(fileName);

      if (!photoPath) {
        return null;
      }

      return {
        photoPath,
        name: name || fileName.replace(/\.[^.]+$/, ''),
        headline: text,
      };
    })
    .filter(Boolean);
}

export async function GET() {
  try {
    const updatedExcelPath = path.join(process.cwd(), 'public', 'mla.updated.xlsx');
    const defaultExcelPath = path.join(process.cwd(), 'public', 'mla.xlsx');
    let excelPath = defaultExcelPath;

    try {
      await fs.access(updatedExcelPath);
      excelPath = updatedExcelPath;
    } catch {
      excelPath = defaultExcelPath;
    }

    const fileBuffer = await fs.readFile(excelPath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!firstSheet) {
      return NextResponse.json({ entries: [] });
    }

    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
    let entries = rows
      .map((row) => {
        const normalizedRow = normalizeRowKeys(row);
        const fileName = getCell(normalizedRow, ['file', 'filename', 'photopath', 'photo', 'image', 'imagename']);
        const text = getCell(normalizedRow, ['text', 'headline', 'resulttext', 'label', 'title']);
        const name = getCell(normalizedRow, ['name', 'candidate', 'mla', 'displayname']);
        const photoPath = normalizePhotoPath(fileName);

        if (!photoPath) {
          return null;
        }

        return {
          photoPath,
          name: name || fileName.replace(/\.[^.]+$/, ''),
          headline: text,
        };
      })
      .filter(Boolean);

    if (entries.length === 0) {
      const matrixRows = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: '',
      });
      entries = rowsFromMatrix(matrixRows);
    }

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { entries: [], error: `Failed to read mla.xlsx: ${String(error)}` },
      { status: 500 },
    );
  }
}
