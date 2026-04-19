'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

// Counter animation component for score
const AnimatedScore = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 1000;
    const startTime = performance.now();

    const animateAt = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.floor(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateAt);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animateAt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{displayValue}</>;
};

const SymbolIcon = ({ symbol }) => {
  switch (symbol) {
    case 'Flowers & Grass':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M22 49c0-12 4-20 10-28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M42 49c0-12-4-20-10-28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 51h32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 18c0 4-3 7-7 7 0-4 3-7 7-7Z" fill="currentColor" />
          <path d="M18 14c4 0 7 3 7 7-4 0-7-3-7-7Z" fill="currentColor" opacity="0.9" />
          <path d="M28 14c0 4-3 7-7 7 0-4 3-7 7-7Z" fill="currentColor" opacity="0.75" />
          <circle cx="22" cy="21" r="3.2" fill="#0f172a" />
          <path d="M46 18c0 4-3 7-7 7 0-4 3-7 7-7Z" fill="currentColor" />
          <path d="M40 14c4 0 7 3 7 7-4 0-7-3-7-7Z" fill="currentColor" opacity="0.9" />
          <path d="M50 14c0 4-3 7-7 7 0-4 3-7 7-7Z" fill="currentColor" opacity="0.75" />
          <circle cx="44" cy="21" r="3.2" fill="#0f172a" />
          <path d="M32 49V28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M29 36c-6 0-10 4-10 10 6 0 10-4 10-10Z" fill="currentColor" opacity="0.7" />
          <path d="M35 34c6 0 10 4 10 10-6 0-10-4-10-10Z" fill="currentColor" opacity="0.7" />
        </svg>
      );
    case 'Lotus':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 47c-8-3-13-9-13-17 6 2 11 7 13 17Z" fill="currentColor" opacity="0.8" />
          <path d="M32 47c8-3 13-9 13-17-6 2-11 7-13 17Z" fill="currentColor" opacity="0.8" />
          <path d="M32 44c-5-4-8-10-7-18 5 3 8 8 7 18Z" fill="currentColor" />
          <path d="M32 44c5-4 8-10 7-18-5 3-8 8-7 18Z" fill="currentColor" />
          <path d="M32 42c-3-5-3-11 0-18 3 7 3 13 0 18Z" fill="currentColor" opacity="0.95" />
          <path d="M22 49h20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 49v7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'Hammer, Sickle & Star':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M15 42c0-11 8-20 19-20 4 0 8 1 11 3-3-5-9-8-16-8-12 0-22 10-22 22 0 8 4 15 11 19" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M35 17l4 4-7 7 10 10-4 4-10-10-7 7-4-4 7-7-4-4 4-4 4 4 7-7Z" fill="currentColor" />
          <path d="M47 11l1.8 5.2H54l-4.2 3 1.6 5.1-4.4-3.1-4.4 3.1 1.6-5.1-4.2-3h5.2Z" fill="currentColor" />
        </svg>
      );
    case 'Hand':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M20 51c-3-4-5-8-5-13 0-4 2-6 5-6 2 0 4 1 5 3V18c0-2 1-4 3-4s3 2 3 4v13h2V15c0-2 1-4 3-4s3 2 3 4v16h2V18c0-2 1-4 3-4s3 2 3 4v16h2v-9c0-2 1-4 3-4s3 2 3 4v11c0 11-7 19-18 19H30c-4 0-7-1-10-4Z" fill="currentColor" />
        </svg>
      );
    case 'Lion':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="31" cy="28" r="14" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="31" cy="28" r="8" fill="currentColor" opacity="0.9" />
          <path d="M43 37c6 2 10 7 10 13v4h-6v-3c0-3-2-6-5-7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M22 39v15h-6V40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M35 39v15h-6V41" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M16 28c-4 2-7 6-7 11 0 3 1 6 3 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M44 22l8-5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="28" cy="27" r="1.5" fill="#0f172a" />
          <circle cx="34" cy="27" r="1.5" fill="#0f172a" />
          <path d="M28 32c2 2 4 2 6 0" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

export default function PartySeats({
  parties = [],
  isPlaying = false,
  stateName = 'West Bengal',
  totalSeats,
}) {
  // Calculate max score to normalize the bar width
  const maxScore = Math.max(...parties.map(p => p.seats), 1);
  const declaredSeats = parties.reduce((sum, p) => sum + p.seats, 0);
  const activeTotalSeats = typeof totalSeats === 'number' ? totalSeats : declaredSeats;

  return (
    <div className={`graphic-wrapper ${isPlaying ? 'is-playing' : ''}`}>
      <div className="party-seats-container">
        <div className="party-card party-card--meta" style={{ '--party-color': '#ffffff' }}>
          <div className="party-card-bg-glow"></div>

          <div className="party-card-content">
            <div className="party-header">
              <div className="party-symbol party-symbol--featured meta-symbol" aria-hidden="true">
                <span className="party-symbol-icon meta-symbol-icon">
                  <Image
                    src="/wb.png"
                    alt="West Bengal"
                    width={72}
                    height={72}
                    className="meta-symbol-image"
                  />
                </span>
              </div>
              <div className="party-name party-name--meta">{stateName}</div>
            </div>
            <div className="party-score party-score--meta">
              <span className="party-score-declared">
                <AnimatedScore value={isPlaying ? declaredSeats : 0} />
              </span>
              <span className="party-score-separator">/</span>
              <span className="party-score-total">{activeTotalSeats}</span>
            </div>
          </div>

          <div className="party-bar-container">
            <div
              className="party-bar"
              style={{
                width: `${activeTotalSeats > 0 ? ((isPlaying ? declaredSeats : 0) / activeTotalSeats) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>
        {parties.map((party, index) => {
          // If playing, show actual seats. If stopped, show 0 to reset bars/numbers
          const activeSeats = isPlaying ? party.seats : 0;
          const percentage = (activeSeats / maxScore) * 100;

          return (
            <div 
              key={index} 
              className="party-card" 
              style={{ '--party-color': party.color }}
            >
              <div className="party-card-bg-glow"></div>
              
              <div className="party-card-content">
                <div className="party-header">
                  {party.symbol ? (
                    <div className="party-symbol party-symbol--featured">
                      <span className="party-symbol-icon" aria-hidden="true">
                        {party.symbolImage ? (
                          <Image
                            src={party.symbolImage}
                            alt={party.symbol}
                            width={56}
                            height={56}
                            className="party-symbol-image"
                          />
                        ) : (
                          <SymbolIcon symbol={party.symbol} />
                        )}
                      </span>
                    </div>
                  ) : null}
                  <div className="party-name">{party.shortName || party.name}</div>
                </div>
                <div className="party-score" style={{ textShadow: `0 0 32px ${party.color}40` }}>
                  <AnimatedScore value={activeSeats} />
                </div>
              </div>
              
              <div className="party-bar-container">
                <div 
                  className="party-bar" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
