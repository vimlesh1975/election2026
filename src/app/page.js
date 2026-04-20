'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { defaultParties, defaultTemplateMeta, enrichParty } from '../lib/partyData';
import { defaultWinnerPhotoMeta, getPhotoDisplayName } from '../lib/winnerPhotoData';
import { wbMlaShowcase } from '../lib/wbMlaShowcase';

export default function Dashboard() {
  const [parties, setParties] = useState(() => defaultParties.map(enrichParty));
  const [templateMeta, setTemplateMeta] = useState(defaultTemplateMeta);
  const [mlaEntries, setMlaEntries] = useState(wbMlaShowcase);

  useEffect(() => {
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousHtmlBackground = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = '#0f172a';
    document.documentElement.style.backgroundColor = '#0f172a';

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

        setMlaEntries(payload.entries);
      } catch (error) {
        console.error('Failed to load mla.xlsx entries:', error);
      }
    };

    loadMlaEntries();

    return () => {
      isMounted = false;
    };
  }, []);

  const sendCommand = async (command, template, data) => {
    try {
      const res = await fetch('/api/caspar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, template, data }),
      });
      await res.json();
    } catch (e) {
      console.error('Failed to send CasparCG command:', e);
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

  const updateTemplateMeta = (field, value) => {
    setTemplateMeta((current) => ({
      ...current,
      [field]: field === 'totalSeats' ? (parseInt(value, 10) || 0) : value,
    }));
  };

  const partyTemplateData = { ...templateMeta, parties };
  const firstMlaEntry = mlaEntries[0];
  const winnerPhotoPath = firstMlaEntry?.photoPath || defaultWinnerPhotoMeta.photoPath;
  const winnerPhotoName = firstMlaEntry?.name || getPhotoDisplayName(winnerPhotoPath);
  const winnerHeadlinePreview = firstMlaEntry?.headline || defaultWinnerPhotoMeta.resultText;
  const excelEntryPreview = mlaEntries
    .map((entry) => {
      const name = entry?.name?.trim();
      const headline = entry?.headline?.trim();
      if (!name && !headline) {
        return '';
      }
      if (!name) {
        return headline;
      }
      if (!headline) {
        return name;
      }
      return `${name} - ${headline}`;
    })
    .filter((line) => line.length > 0);
  const winnerTemplateData = {
    ...defaultWinnerPhotoMeta,
    entries: mlaEntries,
  };

  return (
    <div
      style={{
        padding: '40px',
        background: '#0f172a',
        width: '1920px',
        height: '1080px',
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
          gap: '24px',
          width: '100%',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(255,255,255,0.05)',
              padding: '32px',
              borderRadius: '8px',
            }}
          >
            <h2>Template Info</h2>
            <div
              style={{
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: '56px 220px 120px',
                justifyContent: 'start',
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
                aria-label="State symbol"
                title="State symbol"
              >
                <Image
                  src="/wb.png"
                  alt="West Bengal"
                  width={44}
                  height={44}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <input
                type="text"
                value={templateMeta.stateName}
                onChange={(e) => updateTemplateMeta('stateName', e.target.value)}
                placeholder="State name"
                style={{
                  width: '220px',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '8px',
                }}
              />
              <input
                type="number"
                value={templateMeta.totalSeats}
                onChange={(e) => updateTemplateMeta('totalSeats', e.target.value)}
                placeholder="Total seats"
                style={{
                  width: '120px',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '8px',
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(255,255,255,0.05)',
              padding: '32px',
              borderRadius: '8px',
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
                  gridTemplateColumns: '56px 70px 100px',
                  justifyContent: 'start',
                  width: '100%',
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
                  value={party.shortName || party.name}
                  onChange={(e) => updateParty(i, 'shortName', e.target.value)}
                  placeholder="Short name"
                  style={{
                    width: '70px',
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
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'rgba(255,255,255,0.05)',
              padding: '24px',
              borderRadius: '8px',
            }}
          >
            <h2 style={{ margin: 0 }}>Party Seats Controls</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => sendCommand('play', 'partySeats', partyTemplateData)}
                style={{ background: '#22c55e', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}
              >
                Show Party Graphic
              </button>

              <button
                onClick={() => sendCommand('update', 'partySeats', partyTemplateData)}
                style={{ background: '#3b82f6', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
              >
                Update Party Data
              </button>

              <button
                onClick={() => sendCommand('stop', 'partySeats')}
                style={{ background: '#ef4444', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
              >
                Stop Party Graphic
              </button>

              <button
                onClick={() => sendCommand('clear', 'partySeats')}
                style={{ background: '#64748b', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Clear Party Layer
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(255,255,255,0.05)',
              padding: '32px',
              borderRadius: '8px',
            }}
          >
            <h2>Winner Photo Template</h2>
            <div
              style={{
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: '160px minmax(280px, 1fr)',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={winnerPhotoPath}
                  alt={winnerPhotoName || 'Winner preview'}
                  width={140}
                  height={140}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Slideshow folder: <strong>/public/mlas/west-bengal</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                  Photos rotate every <strong>5 seconds</strong> when you press play.
                </div>
                <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                  <strong>Loaded texts:</strong>
                  {mlaEntries.length ? (
                    <div style={{ marginTop: '8px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '8px',
                                borderBottom: '1px solid rgba(255,255,255,0.2)',
                                color: '#e2e8f0',
                              }}
                            >
                              Name
                            </th>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '8px',
                                borderBottom: '1px solid rgba(255,255,255,0.2)',
                                color: '#e2e8f0',
                              }}
                            >
                              Text
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {mlaEntries.map((entry, index) => (
                            <tr key={`${entry?.name || 'entry'}-${index}`}>
                              <td
                                style={{
                                  padding: '8px',
                                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                                  color: '#f8fafc',
                                }}
                              >
                                {entry?.name || '-'}
                              </td>
                              <td
                                style={{
                                  padding: '8px',
                                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                                }}
                              >
                                {entry?.headline || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px' }}>No text in sheet</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'rgba(255,255,255,0.05)',
              padding: '24px',
              borderRadius: '8px',
            }}
          >
            <h2 style={{ margin: 0 }}>Winner Photo Controls</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => sendCommand('play', 'winnerPhoto', winnerTemplateData)}
                style={{ background: '#22c55e', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}
              >
                Play MLA Slideshow
              </button>

              <button
                onClick={() => sendCommand('update', 'winnerPhoto', winnerTemplateData)}
                style={{ background: '#3b82f6', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
              >
                Update MLA Slideshow
              </button>

              <button
                onClick={() => sendCommand('stop', 'winnerPhoto')}
                style={{ background: '#ef4444', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
              >
                Stop Winner Photo
              </button>

              <button
                onClick={() => sendCommand('clear', 'winnerPhoto')}
                style={{ background: '#64748b', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Clear Winner Layer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '40px', fontSize: '14px', color: '#64748b' }}>
        Note: The graphic templates are hosted at <a href="/template" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>/template</a> and <a href="/winner-template" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>/winner-template</a>
      </div>
    </div>
  );
}
