'use client';

import Image from 'next/image';
import { useState } from 'react';
import { defaultParties, enrichParty } from '../lib/partyData';

export default function Dashboard() {
  const [parties, setParties] = useState(() => defaultParties.map(enrichParty));
  const [status, setStatus] = useState('Ready to connect.');

  const sendCommand = async (command) => {
    setStatus('Sending command...');
    try {
      const res = await fetch('/api/caspar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, data: { parties } }),
      });
      const result = await res.json();
      if (result.success) {
        setStatus(`Success: Sent -> ${result.cmdSent}`);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (e) {
      setStatus(`Network Error: ${e.message}`);
    }
  };

  const updateParty = (index, field, value) => {
    const nextParties = [...parties];
    const normalizedValue = field === 'seats' ? (parseInt(value, 10) || 0) : value;

    nextParties[index] = enrichParty({
      ...nextParties[index],
      [field]: normalizedValue,
    });

    setParties(nextParties);
  };

  return (
    <div
      style={{
        padding: '40px',
        background: '#0f172a',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        color: 'white',
        alignItems: 'center',
        overflowY: 'auto',
      }}
    >
      <h1>CasparCG Election Control Panel</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'rgba(255,255,255,0.05)',
          padding: '32px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '980px',
        }}
      >
        <h2>Party Data</h2>
        {parties.map((party, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gap: '12px',
              alignItems: 'center',
              gridTemplateColumns: '56px minmax(0,1.5fr) minmax(0,1fr) 110px 56px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
              }}
            >
              {party.symbolImage ? (
                <Image
                  src={party.symbolImage}
                  alt={party.symbol || party.name}
                  width={44}
                  height={44}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: party.color,
                    border: '2px solid rgba(255,255,255,0.5)',
                  }}
                />
              )}
            </div>
            <input
              type="text"
              value={party.name}
              onChange={(e) => updateParty(i, 'name', e.target.value)}
              placeholder="Party name"
              style={{
                padding: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
              }}
            />
            <input
              type="text"
              value={party.symbol || ''}
              onChange={(e) => updateParty(i, 'symbol', e.target.value)}
              placeholder="Party symbol"
              style={{
                padding: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
              }}
            />
            <input
              type="number"
              value={party.seats}
              onChange={(e) => updateParty(i, 'seats', e.target.value)}
              placeholder="Seats"
              style={{
                width: '100px',
                padding: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
              }}
            />
            <input
              type="color"
              value={party.color}
              onChange={(e) => updateParty(i, 'color', e.target.value)}
              style={{
                width: '50px',
                height: '46px',
                padding: '0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => sendCommand('play')}
          style={{ background: '#22c55e', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}
        >
          Show Graphic (Play)
        </button>

        <button
          onClick={() => sendCommand('update')}
          style={{ background: '#3b82f6', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
        >
          Update Data Automatically
        </button>

        <button
          onClick={() => sendCommand('stop')}
          style={{ background: '#ef4444', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
        >
          Animate Off (Stop)
        </button>

        <button
          onClick={() => sendCommand('clear')}
          style={{ background: '#64748b', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Hard Clear Layer
        </button>
      </div>

      <div style={{ display: 'flex', padding: '16px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', width: '100%', maxWidth: '980px', fontSize: '14px', fontFamily: 'monospace', color: '#cbd5e1' }}>
        Console: {status}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '40px', fontSize: '14px', color: '#64748b' }}>
        Note: The graphic template is hosted at <a href="/template" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>/template</a>
      </div>
    </div>
  );
}
