'use client';

import { useEffect, useState } from 'react';
import WinnerPhotoCard from '../../components/WinnerPhotoCard';
import { useCasparCG } from '../../hooks/useCasparCG';
import { defaultWinnerPhotoMeta } from '../../lib/winnerPhotoData';
import { wbMlaShowcase } from '../../lib/wbMlaShowcase';

export default function WinnerTemplatePage() {
  const { isPlaying, data } = useCasparCG();
  const [excelEntries, setExcelEntries] = useState(wbMlaShowcase);

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

  useEffect(() => {
    let isMounted = true;

    const loadMlaEntries = async () => {
      try {
        const response = await fetch('/api/mla-entries', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!isMounted || !Array.isArray(payload.entries) || payload.entries.length === 0) {
          return;
        }

        setExcelEntries(payload.entries);
      } catch (error) {
        console.error('Failed to load mla.xlsx entries:', error);
      }
    };

    loadMlaEntries();

    return () => {
      isMounted = false;
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
        entries={activeData.entries || excelEntries}
      />
    </main>
  );
}
