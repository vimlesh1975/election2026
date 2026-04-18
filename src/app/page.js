'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [parties, setParties] = useState([
    { name: 'Red Party', seats: 120, color: '#ef4444' },
    { name: 'Blue Party', seats: 110, color: '#3b82f6' },
    { name: 'Green Party', seats: 54, color: '#22c55e' },
    { name: 'Yellow Party', seats: 36, color: '#eab308' },
    { name: 'Purple Party', seats: 12, color: '#a855f7' },
  ]);
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
    nextParties[index][field] = field === 'seats' ? (parseInt(value) || 0) : value;
    setParties(nextParties);
  };

  return (
    <div style={{ padding: '40px', background: '#0f172a', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', gap: '32px', color: 'white', alignItems: 'center', overflowY: 'auto' }}>
      <h1>CasparCG Election Control Panel</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '800px' }}>
        <h2>Party Data</h2>
        {parties.map((party, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: party.color, border: '2px solid rgba(255,255,255,0.5)' }}></div>
            <input 
              type="text" 
              value={party.name} 
              onChange={(e) => updateParty(i, 'name', e.target.value)}
              style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
            />
            <input 
              type="number" 
              value={party.seats} 
              onChange={(e) => updateParty(i, 'seats', e.target.value)}
              style={{ width: '100px', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
            />
            <input 
              type="color" 
              value={party.color}
              onChange={(e) => updateParty(i, 'color', e.target.value)}
              style={{ width: '50px', height: '46px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => sendCommand('play')}
          style={{ background: '#22c55e', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}
        >Show Graphic (Play)</button>

        <button 
          onClick={() => sendCommand('update')}
          style={{ background: '#3b82f6', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
        >Update Data Automatically</button>

        <button 
          onClick={() => sendCommand('stop')}
          style={{ background: '#ef4444', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
        >Animate Off (Stop)</button>

        <button 
          onClick={() => sendCommand('clear')}
          style={{ background: '#64748b', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
        >Hard Clear Layer</button>
      </div>

      <div style={{ display: 'flex', padding: '16px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', width: '100%', maxWidth: '800px', fontSize: '14px', fontFamily: 'monospace', color: '#cbd5e1' }}>
        Console: {status}
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '40px', fontSize: '14px', color: '#64748b' }}>
        Note: The graphic template is hosted at <a href="/template" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>/template</a>
      </div>
    </div>
  );
}
