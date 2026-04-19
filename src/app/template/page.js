'use client';

import { useCasparCG } from '../../hooks/useCasparCG';
import PartySeats from '../../components/PartySeats';
import { defaultParties, enrichParty } from '../../lib/partyData';

export default function Home() {
  const { isPlaying, data } = useCasparCG();

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
