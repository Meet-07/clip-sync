import { useState, useEffect, useRef, useCallback } from 'react';
import { saveHistoryToLocal, loadHistoryFromLocal } from '../utils/storage.js';

const MAX_HISTORY = 500;

export function useSyncSocket() {
  const [history, setHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'connecting' | 'offline'
  const [serverInfo, setServerInfo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  // Load cached history immediately on mount
  useEffect(() => {
    loadHistoryFromLocal().then(cached => {
      if (cached && cached.length > 0) {
        setHistory(cached);
      }
    });
  }, []);

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Determine WebSocket target URL
  const getWsUrl = useCallback(() => {
    const customHost = localStorage.getItem('clipsync_custom_host');
    if (customHost) {
      const clean = customHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/$/, '');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${clean}/ws`;
    }

    // Default to current host if served by the PC server, or localhost fallback
    const host = window.location.host || 'localhost:7331';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${host}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
    }

    setConnectionStatus('connecting');
    const wsUrl = getWsUrl();
    console.log('[ClipSync] Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[ClipSync] Connected to PC background service!');
        setConnectionStatus('connected');
        retryCountRef.current = 0;
        showToast('Connected to PC Clipboard Sync', 'success');
      };

      ws.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch (err) {
          console.error('[ClipSync] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('offline');
        scheduleReconnect();
      };

      ws.onerror = () => {
        setConnectionStatus('offline');
      };
    } catch (err) {
      setConnectionStatus('offline');
      scheduleReconnect();
    }
  }, [getWsUrl, showToast]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 8000);
    retryCountRef.current += 1;
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const handleServerMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'INIT': {
        if (Array.isArray(msg.history)) {
          setHistory(msg.history.slice(0, MAX_HISTORY));
          saveHistoryToLocal(msg.history.slice(0, MAX_HISTORY));
        }
        if (msg.serverInfo) {
          setServerInfo(msg.serverInfo);
        }
        break;
      }
      case 'NEW_CLIP': {
        const item = msg.data;
        if (!item) break;

        setHistory(prev => {
          // Check if already present
          const exists = prev.some(i => i.id === item.id || (i.text === item.text && i.id === item.id));
          if (exists) return prev;

          let next = [item, ...prev];
          if (next.length > MAX_HISTORY) {
            // Trim oldest unpinned
            let excess = next.length - MAX_HISTORY;
            for (let i = next.length - 1; i >= 0 && excess > 0; i--) {
              if (!next[i].isPinned) {
                next.splice(i, 1);
                excess--;
              }
            }
            if (next.length > MAX_HISTORY) {
              next = next.slice(0, MAX_HISTORY);
            }
          }
          saveHistoryToLocal(next);
          return next;
        });

        if (item.source === 'pc') {
          showToast(`Synced from PC: "${item.preview}"`, 'sync');
        }
        break;
      }
      case 'ITEM_UPDATED': {
        const updated = msg.data;
        if (!updated) break;
        setHistory(prev => {
          const next = prev.map(i => i.id === updated.id ? updated : i);
          saveHistoryToLocal(next);
          return next;
        });
        break;
      }
      case 'ITEM_DELETED': {
        setHistory(prev => {
          const next = prev.filter(i => i.id !== msg.id);
          saveHistoryToLocal(next);
          return next;
        });
        break;
      }
      case 'HISTORY_CLEARED': {
        setHistory(prev => {
          const next = prev.filter(i => i.isPinned);
          saveHistoryToLocal(next);
          return next;
        });
        showToast('Clipboard history cleared', 'info');
        break;
      }
    }
  }, [showToast]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Actions
  const sendToPC = useCallback((text) => {
    if (!text || !text.trim()) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'COPY_TO_PC',
        text: text.trim()
      }));
      showToast('Sent to PC clipboard (Ready for Ctrl+V)!', 'success');
    } else {
      showToast('PC offline. Item saved to phone history only.', 'warning');
      // Still add locally
      const localItem = {
        id: `local_${Date.now()}`,
        text: text.trim(),
        preview: text.trim().substring(0, 100),
        type: 'text',
        source: 'phone',
        isPinned: false,
        charCount: text.length,
        lineCount: text.split('\n').length,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => {
        const next = [localItem, ...prev].slice(0, MAX_HISTORY);
        saveHistoryToLocal(next);
        return next;
      });
    }
  }, [showToast]);

  const togglePin = useCallback((id) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'TOGGLE_PIN', id }));
    } else {
      setHistory(prev => {
        const next = prev.map(i => i.id === id ? { ...i, isPinned: !i.isPinned } : i);
        saveHistoryToLocal(next);
        return next;
      });
    }
  }, []);

  const deleteItem = useCallback((id) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'DELETE_ITEM', id }));
    } else {
      setHistory(prev => {
        const next = prev.filter(i => i.id !== id);
        saveHistoryToLocal(next);
        return next;
      });
    }
  }, []);

  const clearHistory = useCallback((keepPinned = true) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'CLEAR_HISTORY', keepPinned }));
    } else {
      setHistory(prev => {
        const next = keepPinned ? prev.filter(i => i.isPinned) : [];
        saveHistoryToLocal(next);
        return next;
      });
    }
  }, []);

  return {
    history,
    connectionStatus,
    serverInfo,
    toastMessage,
    sendToPC,
    togglePin,
    deleteItem,
    clearHistory,
    reconnect: connect
  };
}
