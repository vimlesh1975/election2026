import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

const DEFAULT_MLA_DIR = '/mlas/west-bengal';
const IMAGE_ROUTE_PREFIX = '/api/mla-images';
const DATA_EXCEL_FILE = 'mla.updated.xlsx';
const DEFAULT_EXCEL_FILE = 'mla.xlsx';
export const dynamic = 'force-dynamic';

function uniquePaths(paths) {
  return [...new Set(paths.filter(Boolean))];
}

function getCommonDataExcelPath() {
  const commonDataDir = process.env.ELECTION_GRAPHIC_DATA_DIR
    || (process.env.PROGRAMDATA && path.join(process.env.PROGRAMDATA, 'ElectionGraphic'));

  if (!commonDataDir) {
    return '';
  }

  return path.join(commonDataDir, DATA_EXCEL_FILE);
}

async function findExcelPath() {
  const publicDir = path.join(process.cwd(), 'public');
  const candidates = uniquePaths([
    process.env.MLA_EXCEL_PATH,
    getCommonDataExcelPath(),
    path.join(publicDir, DATA_EXCEL_FILE),
    path.join(publicDir, DEFAULT_EXCEL_FILE),
  ]);

  for (const candidate of candidates) {
    try {
      await fs.access(/* turbopackIgnore: true */ candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`No MLA Excel file found. Checked: ${candidates.join(', ')}`);
}

function normalizePhotoPath(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const trimmed = fileName.trim().replaceAll('\\', '/');

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith(IMAGE_ROUTE_PREFIX)) {
    return trimmed;
  }

  const relativePath = trimmed.startsWith('/')
    ? trimmed.replace(/^\/+/, '')
    : trimmed.includes('/')
      ? trimmed
      : `${DEFAULT_MLA_DIR.replace(/^\/+/, '')}/${trimmed}`;

  const encodedPath = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${IMAGE_ROUTE_PREFIX}/${encodedPath}`;
}

function getCell(row, keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim()) {
      return String(row[key]).trim();
    }
  }
  return '';
}

function getRawCell(row, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== '') {
      return row[key];
    }
  }

  return undefined;
}

function isTruthySelection(value) {
  if (value == null || value === '') {
    return true;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (['true', 'yes', 'y', '1', 'show', 'take', 'display', 'checked', 'include', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', 'n', '0', 'hide', 'skip', 'omit', 'unchecked', 'exclude', 'off'].includes(normalized)) {
    return false;
  }

  return true;
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

  return /(file|filename|photo|image|text|headline|name|candidate|mla|show|display|checked|take|include)/.test(joined);
}

function rowsFromMatrix(matrixRows) {
  if (!Array.isArray(matrixRows) || matrixRows.length === 0) {
    return [];
  }

  const hasHeaderRow = isHeaderRow(matrixRows[0]);
  const headerKeys = hasHeaderRow
    ? matrixRows[0].map((cell) => String(cell || '').toLowerCase().replace(/[\s_-]+/g, ''))
    : [];
  const startIndex = hasHeaderRow ? 1 : 0;

  return matrixRows
    .slice(startIndex)
    .map((cells) => {
      const row = hasHeaderRow
        ? Object.fromEntries(headerKeys.map((key, index) => [key, cells[index]]))
        : {};
      const fileName = hasHeaderRow
        ? getCell(row, ['file', 'filename', 'photopath', 'photo', 'image', 'imagename'])
        : String(cells[0] || '').trim();
      const text = hasHeaderRow
        ? getCell(row, ['text', 'headline', 'resulttext', 'label', 'title'])
        : String(cells[1] || '').trim();
      const name = hasHeaderRow
        ? getCell(row, ['name', 'candidate', 'mla', 'displayname'])
        : String(cells[2] || '').trim();
      const takeValue = hasHeaderRow
        ? getRawCell(row, ['show', 'display', 'take', 'checked', 'selected', 'include', 'enabled'])
        : cells[3];
      const photoPath = normalizePhotoPath(fileName);

      if (!photoPath || !isTruthySelection(takeValue)) {
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
    const excelPath = await findExcelPath();
    const fileBuffer = await fs.readFile(/* turbopackIgnore: true */ excelPath);
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
        const takeValue = getRawCell(normalizedRow, ['show', 'display', 'take', 'checked', 'selected', 'include', 'enabled']);
        const photoPath = normalizePhotoPath(fileName);

        if (!photoPath || !isTruthySelection(takeValue)) {
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
      { entries: [], error: `Failed to read MLA workbook: ${String(error)}` },
      { status: 500 },
    );
  }
}
