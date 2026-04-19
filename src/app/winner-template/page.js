'use client';

import { useEffect } from 'react';
import WinnerPhotoCard from '../../components/WinnerPhotoCard';
import { useCasparCG } from '../../hooks/useCasparCG';
import { defaultWinnerPhotoMeta } from '../../lib/winnerPhotoData';
import { wbMlaShowcase } from '../../lib/wbMlaShowcase';

export default function WinnerTemplatePage() {
  const { isPlaying, data } = useCasparCG();

  useEffect(() => {
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousHtmlBackground = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';

    return () => {
      document.body.style.backgroundColor = previousBodyBackground;
      document.documentElement.style.backgroundColor = previousHtmlBackground;
    };
  }, []);

  const activeData = data?.photoPath
    ? data
    : defaultWinnerPhotoMeta;

  return (
    <main className="winner-template-container">
      <WinnerPhotoCard
        isPlaying={isPlaying}
        photoPath={activeData.photoPath}
        resultText={activeData.resultText}
        rotationMs={activeData.rotationMs}
        entries={activeData.entries || wbMlaShowcase}
      />
    </main>
  );
}
