import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONTENT_TYPES = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function getDataDir() {
  return process.env.ELECTION_GRAPHIC_DATA_DIR
    || (process.env.PROGRAMDATA && path.join(process.env.PROGRAMDATA, 'ElectionGraphic'))
    || '';
}

function sanitizeSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return null;
  }

  for (const segment of segments) {
    if (
      !segment
      || segment === '.'
      || segment === '..'
      || segment.includes('/')
      || segment.includes('\\')
      || segment.includes(':')
    ) {
      return null;
    }
  }

  return segments;
}

function isInside(basePath, targetPath) {
  const relativePath = path.relative(basePath, targetPath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

async function findSymbolPath(segments) {
  const dataDir = getDataDir();
  const candidates = [
    dataDir ? path.join(dataDir, 'party-symbols', ...segments) : '',
    path.join(process.cwd(), 'public', ...segments),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const root = candidate.includes(`${path.sep}party-symbols${path.sep}`)
      ? path.join(dataDir, 'party-symbols')
      : path.join(process.cwd(), 'public');

    if (!isInside(root, candidate)) {
      continue;
    }

    try {
      const stats = await fs.stat(/* turbopackIgnore: true */ candidate);
      if (stats.isFile()) {
        return candidate;
      }
    } catch {
      // Try the next location.
    }
  }

  return '';
}

export async function GET(_request, { params }) {
  const { imagePath } = await params;
  const segments = sanitizeSegments(imagePath);

  if (!segments) {
    return new Response('Invalid image path', { status: 400 });
  }

  const symbolFilePath = await findSymbolPath(segments);
  if (!symbolFilePath) {
    return new Response('Symbol not found', { status: 404 });
  }

  const buffer = await fs.readFile(/* turbopackIgnore: true */ symbolFilePath);
  const extension = path.extname(symbolFilePath).toLowerCase();

  return new Response(buffer, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
    },
  });
}
