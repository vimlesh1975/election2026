'use client';

import { useEffect } from 'react';
import { useCasparCG } from '../../hooks/useCasparCG';
import PartySeats from '../../components/PartySeats';

const defaultData = {
  parties: [
    { name: 'Party A', seats: 142, color: '#ef4444' },
    { name: 'Party B', seats: 110, color: '#3b82f6' },
    { name: 'Party C', seats: 54, color: '#22c55e' },
    { name: 'Party D', seats: 36, color: '#eab308' },
    { name: 'Party E', seats: 12, color: '#a855f7' },
  ]
};

export default function Home() {
  const { isPlaying, data } = useCasparCG();

  const activeData = data?.parties ? data : defaultData;

  // Add a helpful note to console for debugging in Chrome/CEF
  useEffect(() => {
    console.log("CasparCG Graphic Ready.");
    console.log("Run window.play() to play.");
    console.log("Run window.stop() to stop.");
    console.log("Run window.update(JSON.stringify({ parties: [ ... ] })) to update data.");
  }, []);

  return (
    <main className="container">
      {/* Developer Controls - hover over top left corner to reveal */}
      <div className="dev-controls">
        <button onClick={() => window.play?.()} className="dev-btn play-btn">Play Graphic</button>
        <button onClick={() => window.stop?.()} className="dev-btn stop-btn">Stop Graphic</button>
      </div>

      <PartySeats parties={activeData.parties} isPlaying={isPlaying} />
    </main>
  );
}
