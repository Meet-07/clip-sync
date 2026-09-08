import React, { useState, useEffect, useMemo } from 'react';
import { useSyncSocket } from './hooks/useSyncSocket.js';
import { Header } from './components/Header.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { CategoryFilters } from './components/CategoryFilters.jsx';
import { ClipboardCard } from './components/ClipboardCard.jsx';
import { QuickSendSheet } from './components/QuickSendSheet.jsx';
import { PairingModal } from './components/PairingModal.jsx';
import { Toast } from './components/Toast.jsx';
import { Plus, Trash2, Clipboard, Inbox } from 'lucide-react';
import './App.css';

export default function App() {
  const {
    history,
    connectionStatus,
    serverInfo,
    toastMessage,
    sendToPC,
    togglePin,
    deleteItem,
    clearHistory,
    reconnect
  } = useSyncSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSendSheetOpen, setIsSendSheetOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('clipsync_theme') || 'dark');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [localToast, setLocalToast] = useState(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('clipsync_theme', theme);
  }, [theme]);

  // PWA Install prompt listener
  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleToast = (text, type = 'info') => {
    setLocalToast({ text, type, id: Date.now() });
    setTimeout(() => setLocalToast(null), 3000);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Compute category counts
  const counts = useMemo(() => {
    return {
      all: history.length,
      pinned: history.filter(i => i.isPinned).length,
      url: history.filter(i => i.type === 'url').length,
      code: history.filter(i => i.type === 'code').length,
      text: history.filter(i => i.type === 'text').length,
      email: history.filter(i => i.type === 'email' || i.type === 'phone').length
    };
  }, [history]);

  // Filtered and searched items
  const filteredItems = useMemo(() => {
    let list = history;

    // Filter by category
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'pinned') {
        list = list.filter(i => i.isPinned);
      } else if (selectedFilter === 'email') {
        list = list.filter(i => i.type === 'email' || i.type === 'phone');
      } else {
        list = list.filter(i => i.type === selectedFilter);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i => i.text.toLowerCase().includes(q));
    }

    return list;
  }, [history, selectedFilter, searchQuery]);

  return (
    <div className="app-container">
      <Header
        connectionStatus={connectionStatus}
        itemCount={history.length}
        maxItems={500}
        onOpenPairing={() => setIsPairingModalOpen(true)}
        installPrompt={deferredPrompt}
        onInstall={handleInstallPWA}
        theme={theme}
        onToggleTheme={toggleTheme}
        onReconnect={reconnect}
      />

      <main className="app-main">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <CategoryFilters
          currentFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          counts={counts}
        />

        <div className="history-list-section">
          {filteredItems.length > 0 ? (
            <div className="cards-list">
              {filteredItems.map(item => (
                <ClipboardCard
                  key={item.id}
                  item={item}
                  onTogglePin={togglePin}
                  onDelete={deleteItem}
                  onSendToPC={sendToPC}
                  onToast={handleToast}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Inbox size={40} className="empty-icon" />
              </div>
              <h4 className="empty-title">
                {searchQuery
                  ? 'No matching copied texts'
                  : selectedFilter === 'pinned'
                  ? 'No pinned clips yet'
                  : 'No clipboard history yet'}
              </h4>
              <p className="empty-desc">
                {searchQuery
                  ? 'Try a different search term or clear the filter.'
                  : 'Whenever you press Ctrl+C on your PC, items will appear here automatically!'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Quick-Send Action Button */}
      <div className="fab-container">
        <button
          className="fab-btn"
          onClick={() => setIsSendSheetOpen(true)}
          title="Send text to PC clipboard"
        >
          <Plus size={20} />
          <span>Send to PC</span>
        </button>
      </div>

      {/* Quick Send Modal/Sheet */}
      <QuickSendSheet
        isOpen={isSendSheetOpen}
        onClose={() => setIsSendSheetOpen(false)}
        onSendToPC={sendToPC}
      />

      {/* Pairing & Info Modal */}
      <PairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        serverInfo={serverInfo}
        onToast={handleToast}
      />

      {/* Active Toast */}
      <Toast toast={localToast || toastMessage} />
    </div>
  );
}
