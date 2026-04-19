'use client';

import { useState, useEffect } from 'react';

export function useCasparCG() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const play = () => {
      setIsPlaying(true);
    };

    const stop = () => {
      setIsPlaying(false);
    };

    const next = () => {
      // Hook for NEXT command if needed
    };

    const update = (str) => {
      try {
        const parsedData = typeof str === 'string' ? JSON.parse(str) : str;
        setData(parsedData);
      } catch (e) {
        console.error("Failed to parse CasparCG update data:", e);
      }
    };

    // Replace the bootstrap queueing stubs with live handlers.
    window.play = play;
    window.stop = stop;
    window.next = next;
    window.update = update;

    const queuedCalls = Array.isArray(window.__casparCGQueue) ? [...window.__casparCGQueue] : [];
    window.__casparCGQueue = [];
    const hasQueuedPlay = queuedCalls.some((call) => call?.name === 'play');
    const hasQueuedStop = queuedCalls.some((call) => call?.name === 'stop');

    for (const call of queuedCalls) {
      switch (call.name) {
        case 'play':
          play(...call.args);
          break;
        case 'stop':
          stop(...call.args);
          break;
        case 'next':
          next(...call.args);
          break;
        case 'update':
          update(...call.args);
          break;
        default:
          break;
      }
    }

    // Browser preview fallback: if no play/stop was sent during startup, auto-play the template.
    // Disable with `?autoplay=0`.
    if (!hasQueuedPlay && !hasQueuedStop) {
      try {
        const url = new URL(window.location.href);
        const autoplayDisabled = url.searchParams.get('autoplay') === '0';
        if (!autoplayDisabled) {
          setIsPlaying(true);
        }
      } catch {
        setIsPlaying(true);
      }
    }

    return () => {
      window.play = (...args) => {
        window.__casparCGQueue = window.__casparCGQueue || [];
        window.__casparCGQueue.push({ name: 'play', args });
      };
      window.stop = (...args) => {
        window.__casparCGQueue = window.__casparCGQueue || [];
        window.__casparCGQueue.push({ name: 'stop', args });
      };
      window.next = (...args) => {
        window.__casparCGQueue = window.__casparCGQueue || [];
        window.__casparCGQueue.push({ name: 'next', args });
      };
      window.update = (...args) => {
        window.__casparCGQueue = window.__casparCGQueue || [];
        window.__casparCGQueue.push({ name: 'update', args });
      };
    };
  }, []);

  return { isPlaying, data };
}
