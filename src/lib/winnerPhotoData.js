export const defaultWinnerPhotoMeta = {
  photoPath: '/mlas/west-bengal/mamata-banerjee.jpg',
  resultText: 'Won by 1000+ votes',
  rotationMs: 5000,
};

export function getPhotoDisplayName(photoPath) {
  if (!photoPath || typeof photoPath !== 'string') {
    return '';
  }

  const normalizedPath = photoPath.split('?')[0].split('#')[0];
  const fileName = normalizedPath.split('/').pop() || '';

  return fileName.replace(/\.[^.]+$/, '');
}
