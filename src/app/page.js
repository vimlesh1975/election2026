'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defaultParties, defaultTemplateMeta, enrichParty } from '../lib/partyData';
import { defaultWinnerPhotoMeta } from '../lib/winnerPhotoData';
import { wbMlaShowcase } from '../lib/wbMlaShowcase';

const PARTY_MIXER_FILL_STORAGE_KEY = 'election-party-mixer-fill';
const WINNER_MIXER_FILL_STORAGE_KEY = 'election-winner-mixer-fill';
const defaultWinnerMixerFill = {
  x: Number.isFinite(defaultWinnerPhotoMeta?.x) ? defaultWinnerPhotoMeta.x : 0,
  y: Number.isFinite(defaultWinnerPhotoMeta?.y) ? defaultWinnerPhotoMeta.y : 0,
  scaleX: Number.isFinite(defaultWinnerPhotoMeta?.scaleX) ? defaultWinnerPhotoMeta.scaleX : 1,
  scaleY: Number.isFinite(defaultWinnerPhotoMeta?.scaleY) ? defaultWinnerPhotoMeta.scaleY : 1,
};

function addPhotoRefreshToken(photoPath, refreshToken) {
  if (!photoPath || !refreshToken) {
    return photoPath;
  }

  const hashIndex = photoPath.indexOf('#');
  const pathWithoutHash = hashIndex >= 0 ? photoPath.slice(0, hashIndex) : photoPath;
  const hash = hashIndex >= 0 ? photoPath.slice(hashIndex) : '';
  const separator = pathWithoutHash.includes('?') ? '&' : '?';

  return `${pathWithoutHash}${separator}v=${encodeURIComponent(refreshToken)}${hash}`;
}

function normalizeStoredFillValue(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function Dashboard() {
  const [parties, setParties] = useState(() => defaultParties.map(enrichParty));
  const [templateMeta, setTemplateMeta] = useState(defaultTemplateMeta);
  const [winnerMixerFill, setWinnerMixerFill] = useState(defaultWinnerMixerFill);
  const [mlaEntries, setMlaEntries] = useState(wbMlaShowcase);
  const [photoRefreshToken, setPhotoRefreshToken] = useState(() => Date.now());
  const [isRefreshingMla, setIsRefreshingMla] = useState(false);
  const [mlaRefreshMessage, setMlaRefreshMessage] = useState('Excel data not refreshed yet');
  const hasMountedMixerFillRef = useRef(false);
  const hasLoadedMixerFillRef = useRef(false);
  const hasMountedWinnerMixerFillRef = useRef(false);
  const hasLoadedWinnerMixerFillRef = useRef(false);

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
    try {
      const storedValue = window.localStorage.getItem(PARTY_MIXER_FILL_STORAGE_KEY);
      if (!storedValue) {
        hasLoadedMixerFillRef.current = true;
        return;
      }

      const parsed = JSON.parse(storedValue);
      setTemplateMeta((current) => ({
        ...current,
        x: normalizeStoredFillValue(parsed?.x, defaultTemplateMeta.x),
        y: normalizeStoredFillValue(parsed?.y, defaultTemplateMeta.y),
        scaleX: normalizeStoredFillValue(parsed?.scaleX, defaultTemplateMeta.scaleX),
        scaleY: normalizeStoredFillValue(parsed?.scaleY, defaultTemplateMeta.scaleY),
      }));
    } catch (error) {
      console.error('Failed to restore mixer fill values:', error);
    } finally {
      hasLoadedMixerFillRef.current = true;
    }
  }, []);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(WINNER_MIXER_FILL_STORAGE_KEY);
      if (!storedValue) {
        hasLoadedWinnerMixerFillRef.current = true;
        return;
      }

      const parsed = JSON.parse(storedValue);
      setWinnerMixerFill({
        x: normalizeStoredFillValue(parsed?.x, defaultWinnerMixerFill.x),
        y: normalizeStoredFillValue(parsed?.y, defaultWinnerMixerFill.y),
        scaleX: normalizeStoredFillValue(parsed?.scaleX, defaultWinnerMixerFill.scaleX),
        scaleY: normalizeStoredFillValue(parsed?.scaleY, defaultWinnerMixerFill.scaleY),
      });
    } catch (error) {
      console.error('Failed to restore winner mixer fill values:', error);
    } finally {
      hasLoadedWinnerMixerFillRef.current = true;
    }
  }, []);

  const loadMlaEntries = useCallback(async ({ signal, showStatus = false } = {}) => {
    if (showStatus) {
      setIsRefreshingMla(true);
      setMlaRefreshMessage('Refreshing Excel data...');
    }

    try {
      const response = await fetch(`/api/mla-entries?refresh=${Date.now()}`, {
        cache: 'no-store',
        signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (signal?.aborted) {
        return;
      }

      if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
        setMlaRefreshMessage('No rows found in Excel. Keeping current data.');
        return;
      }

      setMlaEntries(payload.entries);
      setPhotoRefreshToken(Date.now());
      setMlaRefreshMessage(
        `Loaded ${payload.entries.length} entries at ${new Date().toLocaleTimeString()}`,
      );
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      setMlaRefreshMessage('Refresh failed. Check the Excel file and image file names.');
      console.error('Failed to load MLA Excel entries:', error);
    } finally {
      if (showStatus && !signal?.aborted) {
        setIsRefreshingMla(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      loadMlaEntries({ signal: controller.signal });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadMlaEntries]);

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

  const sendPartyMixerFill = useCallback(async (fillData) => {
    await sendCommand('mixerFill', 'partySeats', fillData);
  }, []);

  const sendWinnerMixerFill = useCallback(async (fillData) => {
    await sendCommand('mixerFill', 'winnerPhoto', fillData);
  }, []);

  const sendPartyGraphicCommand = async (command) => {
    if (command === 'play' || command === 'update') {
      await sendCommand(command, 'partySeats', partyTemplateData);
      await sendPartyMixerFill({
        x: templateMeta.x,
        y: templateMeta.y,
        scaleX: templateMeta.scaleX,
        scaleY: templateMeta.scaleY,
      });
      return;
    }

    await sendCommand(command, 'partySeats');
  };

  const sendWinnerGraphicCommand = async (command) => {
    if (command === 'play' || command === 'update') {
      await sendCommand(command, 'winnerPhoto', winnerTemplateData);
      await sendWinnerMixerFill({
        x: winnerMixerFill.x,
        y: winnerMixerFill.y,
        scaleX: winnerMixerFill.scaleX,
        scaleY: winnerMixerFill.scaleY,
      });
      return;
    }

    await sendCommand(command, 'winnerPhoto');
  };

  const resetPartyMixerFill = async () => {
    const resetFill = {
      x: defaultTemplateMeta.x,
      y: defaultTemplateMeta.y,
      scaleX: defaultTemplateMeta.scaleX,
      scaleY: defaultTemplateMeta.scaleY,
    };

    setTemplateMeta((current) => ({
      ...current,
      ...resetFill,
    }));

    await sendPartyMixerFill(resetFill);
  };

  const resetWinnerMixerFill = async () => {
    const resetFill = {
      x: defaultWinnerMixerFill.x,
      y: defaultWinnerMixerFill.y,
      scaleX: defaultWinnerMixerFill.scaleX,
      scaleY: defaultWinnerMixerFill.scaleY,
    };

    setWinnerMixerFill(resetFill);

    await sendWinnerMixerFill(resetFill);
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
    const numericFields = new Set(['totalSeats', 'x', 'y', 'scaleX', 'scaleY']);
    setTemplateMeta((current) => ({
      ...current,
      [field]: numericFields.has(field)
        ? (field === 'totalSeats'
            ? (parseInt(value, 10) || 0)
            : (parseFloat(value) || 0))
        : value,
    }));
  };

  const updateWinnerMixerFill = (field, value) => {
    setWinnerMixerFill((current) => ({
      ...current,
      [field]: parseFloat(value) || 0,
    }));
  };

  const partyTemplateData = { ...templateMeta, parties };
  const refreshedMlaEntries = useMemo(
    () => mlaEntries.map((entry) => ({
      ...entry,
      photoPath: addPhotoRefreshToken(entry?.photoPath, photoRefreshToken),
    })),
    [mlaEntries, photoRefreshToken],
  );
  const winnerTemplateData = {
    ...defaultWinnerPhotoMeta,
    entries: refreshedMlaEntries,
  };
  const declaredSeats = parties.reduce((sum, party) => sum + (party.seats || 0), 0);
  const editorRowStyle = {
    display: 'flex',
    gap: '20px',
    alignItems: 'stretch',
    overflowX: 'auto',
    paddingBottom: '6px',
  };
  const editorCardBaseStyle = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(180deg, rgba(30,41,59,0.94), rgba(15,23,42,0.92))',
    boxShadow: '0 22px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
    padding: '18px 16px 16px',
    overflow: 'hidden',
    flexShrink: 0,
  };
  const editorTextInputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(2,6,23,0.6)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'white',
    borderRadius: '10px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 800,
  };
  const editorNumberInputStyle = {
    width: '100%',
    padding: '12px',
    background: 'rgba(2,6,23,0.72)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: 'white',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '30px',
    fontWeight: 900,
  };
  const editorSymbolBoxStyle = {
    width: '74px',
    height: '74px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
  };

  useEffect(() => {
    if (!hasLoadedMixerFillRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(
        PARTY_MIXER_FILL_STORAGE_KEY,
        JSON.stringify({
          x: templateMeta.x,
          y: templateMeta.y,
          scaleX: templateMeta.scaleX,
          scaleY: templateMeta.scaleY,
        }),
      );
    } catch (error) {
      console.error('Failed to persist mixer fill values:', error);
    }
  }, [templateMeta.scaleX, templateMeta.scaleY, templateMeta.x, templateMeta.y]);

  useEffect(() => {
    if (!hasLoadedWinnerMixerFillRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(
        WINNER_MIXER_FILL_STORAGE_KEY,
        JSON.stringify({
          x: winnerMixerFill.x,
          y: winnerMixerFill.y,
          scaleX: winnerMixerFill.scaleX,
          scaleY: winnerMixerFill.scaleY,
        }),
      );
    } catch (error) {
      console.error('Failed to persist winner mixer fill values:', error);
    }
  }, [winnerMixerFill.scaleX, winnerMixerFill.scaleY, winnerMixerFill.x, winnerMixerFill.y]);

  useEffect(() => {
    if (!hasMountedMixerFillRef.current) {
      hasMountedMixerFillRef.current = true;
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      sendPartyMixerFill({
        x: templateMeta.x,
        y: templateMeta.y,
        scaleX: templateMeta.scaleX,
        scaleY: templateMeta.scaleY,
      });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sendPartyMixerFill, templateMeta.scaleX, templateMeta.scaleY, templateMeta.x, templateMeta.y]);

  useEffect(() => {
    if (!hasMountedWinnerMixerFillRef.current) {
      hasMountedWinnerMixerFillRef.current = true;
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      sendWinnerMixerFill({
        x: winnerMixerFill.x,
        y: winnerMixerFill.y,
        scaleX: winnerMixerFill.scaleX,
        scaleY: winnerMixerFill.scaleY,
      });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sendWinnerMixerFill, winnerMixerFill.scaleX, winnerMixerFill.scaleY, winnerMixerFill.x, winnerMixerFill.y]);

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
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
            order: 2,
            width: '100%',
            flex: '0 0 auto',
            maxHeight: '52%',
            minWidth: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '16px',
              minWidth: 0,
              background: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '10px',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'rgba(255,255,255,0.04)',
                padding: '24px',
                borderRadius: '8px',
                flex: 1,
                minWidth: 0,
              }}
            >
              <h2>Party Data</h2>
              <div
                style={editorRowStyle}
              >
                <div
                  style={{
                    ...editorCardBaseStyle,
                    width: '238px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: '0 0 auto 0',
                      height: '8px',
                      background: '#ffffff',
                      boxShadow: '0 0 18px rgba(255,255,255,0.55)',
                    }}
                  />
                  <div
                    style={{ ...editorSymbolBoxStyle, width: '88px', height: '88px', marginTop: '10px' }}
                    aria-label="State symbol"
                    title="State symbol"
                  >
                    <Image
                      src="/wb.png"
                      alt="West Bengal"
                      width={62}
                      height={62}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="text"
                      value={templateMeta.stateName}
                      onChange={(e) => updateTemplateMeta('stateName', e.target.value)}
                      placeholder="State name"
                      style={{
                        ...editorTextInputStyle,
                        fontSize: '18px',
                      }}
                    />
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#cbd5e1',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Declared: {declaredSeats}
                    </div>
                    <input
                      type="number"
                      value={templateMeta.totalSeats}
                      onChange={(e) => updateTemplateMeta('totalSeats', e.target.value)}
                      placeholder="Total seats"
                      style={editorNumberInputStyle}
                    />
                  </div>
                </div>
                {parties.map((party, i) => (
                  <div
                    key={i}
                    style={{
                      ...editorCardBaseStyle,
                      width: '152px',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: '0 0 auto 0',
                        height: '8px',
                        background: party.color,
                        boxShadow: `0 0 18px ${party.color}`,
                      }}
                    />
                    <div
                      style={{ ...editorSymbolBoxStyle, marginTop: '10px' }}
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
                        ...editorTextInputStyle,
                        fontSize: '15px',
                      }}
                    />
                    <input
                      type="number"
                      value={party.seats}
                      onChange={(e) => updateParty(i, 'seats', e.target.value)}
                      placeholder="Seats"
                      style={{
                        ...editorNumberInputStyle,
                        color: party.color,
                        textShadow: `0 0 18px ${party.color}55`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(255,255,255,0.04)',
                padding: '24px',
                borderRadius: '8px',
                flex: '0 0 360px',
                minWidth: '360px',
                justifyContent: 'center',
              }}
            >
              <h2 style={{ margin: 0 }}>Party Seats Controls</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <button
                  onClick={() => sendPartyGraphicCommand('play')}
                  style={{ background: '#22c55e', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}
                >
                  Show
                </button>

                <button
                  onClick={() => sendPartyGraphicCommand('update')}
                  style={{ background: '#3b82f6', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
                >
                  Update
                </button>

                <button
                  onClick={() => sendPartyGraphicCommand('stop')}
                  style={{ background: '#ef4444', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
                >
                  Stop
                </button>

                <button
                  onClick={() => sendPartyGraphicCommand('clear')}
                  style={{ background: '#64748b', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '8px',
                }}
              >
                <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 700 }}>Mixer Fill</div>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.35)',
                    background: 'rgba(15,23,42,0.45)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,0.18)',
                    width: 'fit-content',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: '8px',
                      gridTemplateColumns: '60px',
                    }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      value={templateMeta.x}
                      onChange={(e) => updateTemplateMeta('x', e.target.value)}
                      placeholder="X"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={templateMeta.y}
                      onChange={(e) => updateTemplateMeta('y', e.target.value)}
                      placeholder="Y"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={templateMeta.scaleX}
                      onChange={(e) => updateTemplateMeta('scaleX', e.target.value)}
                      placeholder="Scale X"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={templateMeta.scaleY}
                      onChange={(e) => updateTemplateMeta('scaleY', e.target.value)}
                      placeholder="Scale Y"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                  <button
                    onClick={resetPartyMixerFill}
                    style={{ background: '#f59e0b', color: 'white', padding: '12px 14px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.4)', alignSelf: 'flex-start', minWidth: '60px' }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            order: 1,
            width: '100%',
            flex: '1 1 auto',
            minWidth: 0,
            minHeight: '280px',
            alignItems: 'flex-start',
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
              flex: '0 1 960px',
              maxWidth: '960px',
              minWidth: 0,
            }}
          >
            <h2>Winner Photo Template</h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minWidth: 0,
                  maxHeight: '360px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Slideshow folder: <strong>{'C:\\ProgramData\\ElectionGraphic\\mlas\\west-bengal'}</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                  Photos rotate every <strong>5 seconds</strong> when you press play.
                </div>
                <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                  <strong>Loaded Excel entries:</strong>
                  {refreshedMlaEntries.length ? (
                    <div
                      style={{
                        marginTop: '8px',
                        maxHeight: '210px',
                        overflow: 'auto',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
                        <thead>
                          <tr>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '8px',
                                borderBottom: '1px solid rgba(255,255,255,0.2)',
                                color: '#e2e8f0',
                                width: '64px',
                              }}
                            >
                              Photo
                            </th>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '8px',
                                borderBottom: '1px solid rgba(255,255,255,0.2)',
                                color: '#e2e8f0',
                                width: '34%',
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
                          {refreshedMlaEntries.map((entry, index) => (
                            <tr key={`${entry?.name || 'entry'}-${index}`}>
                              <td
                                style={{
                                  padding: '8px',
                                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                                }}
                              >
                                <Image
                                  key={`${entry?.photoPath || 'photo'}-${index}`}
                                  src={entry?.photoPath || defaultWinnerPhotoMeta.photoPath}
                                  alt={entry?.name || 'Candidate photo'}
                                  width={44}
                                  height={44}
                                  unoptimized
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    display: 'block',
                                  }}
                                />
                              </td>
                              <td
                                style={{
                                  padding: '8px',
                                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                                  color: '#f8fafc',
                                  overflowWrap: 'anywhere',
                                }}
                              >
                                {entry?.name || '-'}
                              </td>
                              <td
                                style={{
                                  padding: '8px',
                                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                                  overflowWrap: 'anywhere',
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
              flex: '0 0 360px',
              minWidth: '360px',
              justifyContent: 'center',
            }}
          >
            <h2 style={{ margin: 0 }}>Winner Photo Controls</h2>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: '0 0 138px',
                }}
              >
                <button
                  onClick={() => loadMlaEntries({ showStatus: true })}
                  disabled={isRefreshingMla}
                  style={{
                    background: isRefreshingMla ? '#475569' : '#f59e0b',
                    color: 'white',
                    padding: '16px 18px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: isRefreshingMla ? 'wait' : 'pointer',
                    opacity: isRefreshingMla ? 0.78 : 1,
                    boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
                    width: '100%',
                  }}
                >
                  {isRefreshingMla ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
                  onClick={() => sendWinnerGraphicCommand('play')}
                  style={{ background: '#22c55e', color: 'white', padding: '16px 18px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.4)', width: '100%' }}
                >
                  Show
                </button>

                <button
                  onClick={() => sendWinnerGraphicCommand('update')}
                  style={{ background: '#3b82f6', color: 'white', padding: '16px 18px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', width: '100%' }}
                >
                  Update
                </button>

                <button
                  onClick={() => sendWinnerGraphicCommand('stop')}
                  style={{ background: '#ef4444', color: 'white', padding: '16px 18px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)', width: '100%' }}
                >
                  Stop
                </button>

                <button
                  onClick={() => sendWinnerGraphicCommand('clear')}
                  style={{ background: '#64748b', color: 'white', padding: '16px 18px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                >
                  Clear
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: '0 0 auto',
                }}
              >
                <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 700 }}>Mixer Fill</div>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.35)',
                    background: 'rgba(15,23,42,0.45)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,0.18)',
                    width: 'fit-content',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: '8px',
                      gridTemplateColumns: '60px',
                    }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      value={winnerMixerFill.x}
                      onChange={(e) => updateWinnerMixerFill('x', e.target.value)}
                      placeholder="X"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={winnerMixerFill.y}
                      onChange={(e) => updateWinnerMixerFill('y', e.target.value)}
                      placeholder="Y"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={winnerMixerFill.scaleX}
                      onChange={(e) => updateWinnerMixerFill('scaleX', e.target.value)}
                      placeholder="Scale X"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={winnerMixerFill.scaleY}
                      onChange={(e) => updateWinnerMixerFill('scaleY', e.target.value)}
                      placeholder="Scale Y"
                      style={{
                        width: '60px',
                        padding: '10px 8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                  <button
                    onClick={resetWinnerMixerFill}
                    style={{ background: '#f59e0b', color: 'white', padding: '12px 14px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.4)', alignSelf: 'flex-start', minWidth: '60px' }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '14px', textAlign: 'center' }}>
              {mlaRefreshMessage}. Press <strong>Update MLA Slideshow</strong> after refresh if the graphic is already on air.
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
