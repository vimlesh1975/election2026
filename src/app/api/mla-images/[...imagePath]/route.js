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

async function findImagePath(segments) {
  const roots = [
    getDataDir(),
    path.join(process.cwd(), 'public'),
  ].filter(Boolean);

  for (const root of roots) {
    const imagePath = path.join(root, ...segments);

    if (!isInside(root, imagePath)) {
      continue;
    }

    try {
      const stats = await fs.stat(/* turbopackIgnore: true */ imagePath);
      if (stats.isFile()) {
        return imagePath;
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

  const imageFilePath = await findImagePath(segments);
  if (!imageFilePath) {
    return new Response('Image not found', { status: 404 });
  }

  const buffer = await fs.readFile(/* turbopackIgnore: true */ imageFilePath);
  const extension = path.extname(imageFilePath).toLowerCase();

  return new Response(buffer, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
    },
  });
}
