'use client';

import { useEffect, useState } from 'react';
import { useCasparCG } from '../../hooks/useCasparCG';
import PartySeats from '../../components/PartySeats';
import { defaultParties, defaultTemplateMeta, enrichParty } from '../../lib/partyData';

const PARTY_DATA_STORAGE_KEY = 'election-party-data';

function normalizeStoredSeatValue(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function restoreStoredParty(storedParty, fallbackParty) {
  const enrichedFallbackParty = enrichParty(fallbackParty);
  const basePartyName = typeof storedParty?.name === 'string' && storedParty.name.trim()
    ? storedParty.name
    : enrichedFallbackParty.name;
  const enrichedBaseParty = enrichParty({
    ...enrichedFallbackParty,
    name: basePartyName,
  });
  const storedShortName = typeof storedParty?.shortName === 'string'
    ? storedParty.shortName
    : enrichedBaseParty.shortName;

  return {
    ...enrichedBaseParty,
    shortName: storedShortName,
    seats: normalizeStoredSeatValue(storedParty?.seats, enrichedBaseParty.seats),
  };
}

export default function Home() {
  const { isPlaying, data } = useCasparCG();
  const [rememberedParties, setRememberedParties] = useState(() => defaultParties.map(enrichParty));

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
    try {
      const storedValue = window.localStorage.getItem(PARTY_DATA_STORAGE_KEY);
      if (!storedValue) {
        return;
      }

      const parsed = JSON.parse(storedValue);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return;
      }

      setRememberedParties(parsed.map((storedParty, index) => (
        restoreStoredParty(storedParty, defaultParties[index] || defaultParties[0])
      )));
    } catch (error) {
      console.error('Failed to restore template party data:', error);
    }
  }, []);

  const sourceData = data?.parties
    ? data
    : {
        ...defaultTemplateMeta,
        parties: rememberedParties,
      };
  const activeData = {
    ...sourceData,
    parties: sourceData.parties.map(enrichParty),
  };

  return (
    <main className="container template-container">
      <PartySeats
        parties={activeData.parties}
        isPlaying={isPlaying}
        stateName={activeData.stateName}
        totalSeats={activeData.totalSeats}
      />
    </main>
  );
}
