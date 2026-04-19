'use client';

import { useEffect } from 'react';
import { useCasparCG } from '../../hooks/useCasparCG';
import PartySeats from '../../components/PartySeats';
import { defaultParties, enrichParty } from '../../lib/partyData';

export default function Home() {
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

  const sourceData = data?.parties ? data : { parties: defaultParties };
  const activeData = {
    ...sourceData,
    parties: sourceData.parties.map(enrichParty),
  };

  return (
    <main className="container">
      <PartySeats parties={activeData.parties} isPlaying={isPlaying} />
    </main>
  );
}
