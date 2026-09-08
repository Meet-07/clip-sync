import React, { useState } from 'react';
import { QrCode, X, Laptop, Check, Copy, ExternalLink, HelpCircle } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard.js';

export function PairingModal({ isOpen, onClose, serverInfo, currentHost, onToast }) {
  const [customHost, setCustomHost] = useState(
    localStorage.getItem('clipsync_custom_host') || ''
  );
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const accessUrl = serverInfo?.localIp
    ? `http://${serverInfo.localIp}:${serverInfo.port || 7331}`
    : window.location.origin;

  const handleCopyUrl = async () => {
    await copyTextToClipboard(accessUrl);
    setCopiedUrl(true);
    if (onToast) onToast('URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveCustomHost = () => {
    if (customHost.trim()) {
      localStorage.setItem('clipsync_custom_host', customHost.trim());
    } else {
      localStorage.removeItem('clipsync_custom_host');
    }
    window.location.reload();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="pairing-modal" onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <div className="sheet-title-group">
            <QrCode size={20} className="text-accent" />
            <h3 className="sheet-title">Phone Pairing & Info</h3>
          </div>
          <button className="sheet-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pairing-body">
          <div className="qr-container">
            {serverInfo?.localIp ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(accessUrl)}`}
                alt="Scan with phone camera to connect"
                className="qr-image"
              />
            ) : (
              <div className="qr-fallback">
                <Laptop size={36} />
                <span>Connected via: {window.location.host}</span>
              </div>
            )}
            <p className="qr-caption">Scan with your phone camera to open on mobile</p>
          </div>

          <div className="url-box">
            <span className="url-label">Direct Phone URL:</span>
            <div className="url-row">
              <code className="url-text">{accessUrl}</code>
              <button className="url-copy-btn" onClick={handleCopyUrl} title="Copy URL">
                {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="guide-box">
            <div className="guide-header">
              <HelpCircle size={15} />
              <strong>Install as Phone App:</strong>
            </div>
            <ul className="guide-steps">
              <li><strong>Android:</strong> Tap the 3 dots in Chrome/Edge &rarr; <em>"Add to Home screen"</em> or <em>"Install app"</em>.</li>
              <li><strong>iPhone:</strong> Tap the Share button in Safari &rarr; <em>"Add to Home Screen"</em>.</li>
            </ul>
          </div>

          <div className="custom-ip-section">
            <span className="custom-ip-label">Custom PC IP / Host (Optional):</span>
            <div className="custom-ip-row">
              <input
                type="text"
                className="custom-ip-input"
                placeholder="e.g. 192.168.1.15:7331"
                value={customHost}
                onChange={e => setCustomHost(e.target.value)}
              />
              <button className="custom-ip-btn" onClick={handleSaveCustomHost}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
