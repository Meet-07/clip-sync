import React from 'react';
import { Wifi, WifiOff, RefreshCw, QrCode, Download, Moon, Sun, Smartphone } from 'lucide-react';

export function Header({
  connectionStatus,
  itemCount,
  maxItems = 500,
  onOpenPairing,
  installPrompt,
  onInstall,
  theme,
  onToggleTheme,
  onReconnect
}) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-group">
          <div className="brand-icon">
            <Smartphone size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="brand-title">ClipSync</h1>
            <p className="brand-subtitle">PC & Phone Sync</p>
          </div>
        </div>

        <div className="header-actions">
          {installPrompt && (
            <button
              className="action-btn install-btn"
              onClick={onInstall}
              title="Install to Home Screen"
            >
              <Download size={16} />
              <span>Install App</span>
            </button>
          )}

          <button
            className="icon-btn"
            onClick={onOpenPairing}
            title="Pairing QR & Network Info"
          >
            <QrCode size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <div className="header-status-bar">
        <div
          className={`status-pill status-${connectionStatus}`}
          onClick={connectionStatus === 'offline' ? onReconnect : undefined}
          title={connectionStatus === 'offline' ? 'Click to reconnect' : 'Connection state'}
        >
          {connectionStatus === 'connected' && <Wifi size={14} className="status-icon connected" />}
          {connectionStatus === 'connecting' && <RefreshCw size={14} className="status-icon spinning" />}
          {connectionStatus === 'offline' && <WifiOff size={14} className="status-icon offline" />}
          <span className="status-text">
            {connectionStatus === 'connected' && 'Live PC Sync'}
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'offline' && 'Offline (Tap to retry)'}
          </span>
        </div>

        <div className="capacity-pill">
          <span className="capacity-count">{itemCount}</span>
          <span className="capacity-max">/ {maxItems} clips</span>
        </div>
      </div>
    </header>
  );
}
