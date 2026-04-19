'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getPhotoDisplayName } from '../lib/winnerPhotoData';
import { winnerHeadlineOptions, wbMlaShowcase } from '../lib/wbMlaShowcase';

function getRandomHeadline() {
  return winnerHeadlineOptions[Math.floor(Math.random() * winnerHeadlineOptions.length)];
}

const TRANSITION_MS = 760;

function buildSlide(entries, fallbackPhotoPath, fallbackResultText, index) {
  const activeEntry = entries[index] || entries[0];

  return {
    index,
    photoPath: activeEntry?.photoPath || fallbackPhotoPath,
    displayName: activeEntry?.name || getPhotoDisplayName(activeEntry?.photoPath) || 'Unknown Candidate',
    headline: fallbackResultText || getRandomHeadline(),
  };
}

export default function WinnerPhotoCard({
  isPlaying = false,
  photoPath = '/mlas/west-bengal/mamata-banerjee.jpg',
  resultText = 'Won by 1000+ votes',
  entries = wbMlaShowcase,
  rotationMs = 5000,
}) {
  const activeEntries = Array.isArray(entries) && entries.length > 0
    ? entries
    : [{ photoPath, name: getPhotoDisplayName(photoPath) || 'Unknown Candidate' }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(() => buildSlide(activeEntries, photoPath, resultText, 0));
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      setCurrentIndex(0);
      setCurrentSlide(buildSlide(activeEntries, photoPath, resultText, 0));
      setIsAnimatingIn(false);
      return;
    }

    setCurrentIndex(0);
    setCurrentSlide({
      ...buildSlide(activeEntries, photoPath, resultText, 0),
      headline: getRandomHeadline(),
    });
    setIsAnimatingIn(true);

    const animationTimeoutId = window.setTimeout(() => {
      setIsAnimatingIn(false);
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(animationTimeoutId);
    };
  }, [activeEntries, isPlaying, photoPath, resultText]);

  useEffect(() => {
    if (!isPlaying || activeEntries.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeEntries.length);
    }, rotationMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeEntries, isPlaying, rotationMs]);

  useEffect(() => {
    const nextSlide = {
      ...buildSlide(activeEntries, photoPath, resultText, currentIndex),
      headline: getRandomHeadline(),
    };

    setCurrentSlide(nextSlide);
    setIsAnimatingIn(true);

    const animationTimeoutId = window.setTimeout(() => {
      setIsAnimatingIn(false);
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(animationTimeoutId);
    };
  }, [activeEntries, currentIndex, photoPath, resultText]);

  return (
    <div className={`winner-photo-wrapper ${isPlaying ? 'is-playing' : ''}`}>
      <div className={`winner-photo-card ${isAnimatingIn ? 'is-animating-in' : ''}`}>
        <div className="winner-photo-card-glow"></div>
        <div className="winner-photo-layer">
          <div className="winner-photo-frame">
            <Image
              src={currentSlide.photoPath}
              alt={currentSlide.displayName}
              fill
              sizes="480px"
              className="winner-photo-image"
            />
          </div>
          <div className="winner-photo-copy">
            <div className="winner-photo-name">{currentSlide.displayName}</div>
            <div className="winner-photo-result">{currentSlide.headline}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
