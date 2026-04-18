'use client';

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

export default function PartySeats({ parties = [], isPlaying = false }) {
  // Calculate max score to normalize the bar width
  const maxScore = Math.max(...parties.map(p => p.seats), 1);
  const totalSeats = parties.reduce((sum, p) => sum + p.seats, 0);

  return (
    <div className={`graphic-wrapper ${isPlaying ? 'is-playing' : ''}`}>
      <div className="header-container">
        <h1 className="election-title">Election Results 2026</h1>
        <div className="total-seats-badge">
          Total Seats Declared: <AnimatedScore value={isPlaying ? totalSeats : 0} />
        </div>
      </div>
      
      <div className="party-seats-container">
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
                <div className="party-name">{party.name}</div>
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
