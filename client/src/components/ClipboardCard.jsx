import React, { useState } from 'react';
import {
  Copy,
  Check,
  Star,
  Trash2,
  Share2,
  ExternalLink,
  Laptop,
  Smartphone,
  Link,
  Code,
  FileText,
  AtSign,
  Phone
} from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard.js';
import { formatTimeAgo } from '../utils/detector.js';

export function ClipboardCard({ item, onTogglePin, onDelete, onSendToPC, onToast }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyTextToClipboard(item.text);
    if (success) {
      setCopied(true);
      if (onToast) onToast('Copied to phone clipboard! 📋', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      if (onToast) onToast('Failed to copy', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: item.text,
          title: 'Shared from ClipSync'
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'url': return <Link size={12} />;
      case 'code': return <Code size={12} />;
      case 'email': return <AtSign size={12} />;
      case 'phone': return <Phone size={12} />;
      default: return <FileText size={12} />;
    }
  };

  return (
    <div className={`clip-card ${item.isPinned ? 'pinned' : ''}`}>
      <div className="card-header">
        <div className="badge-group">
          {/* Source badge */}
          <span className={`source-badge source-${item.source}`}>
            {item.source === 'pc' ? <Laptop size={12} /> : <Smartphone size={12} />}
            <span>{item.source === 'pc' ? 'From PC' : 'Phone'}</span>
          </span>

          {/* Content type badge */}
          <span className={`type-badge type-${item.type}`}>
            {getTypeIcon()}
            <span>{item.type}</span>
          </span>

          <span className="card-time">{formatTimeAgo(item.timestamp)}</span>
        </div>

        <div className="card-top-actions">
          <button
            className={`pin-btn ${item.isPinned ? 'active' : ''}`}
            onClick={() => onTogglePin(item.id)}
            title={item.isPinned ? 'Unpin' : 'Pin to prevent deletion'}
            aria-label="Pin item"
          >
            <Star size={15} fill={item.isPinned ? 'currentColor' : 'none'} />
          </button>

          <button
            className="delete-btn"
            onClick={() => onDelete(item.id)}
            title="Delete this clip"
            aria-label="Delete item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={`card-body ${item.type === 'code' ? 'code-mode' : ''}`}>
        {item.type === 'url' ? (
          <div className="url-preview">
            <a href={item.text} target="_blank" rel="noopener noreferrer" className="url-link">
              <span>{item.text}</span>
              <ExternalLink size={13} className="external-icon" />
            </a>
          </div>
        ) : (
          <pre className="clip-text-content">{item.text}</pre>
        )}
      </div>

      <div className="card-footer">
        <span className="card-meta">
          {item.charCount} chars • {item.lineCount} line{item.lineCount > 1 ? 's' : ''}
        </span>

        <div className="card-footer-actions">
          {typeof navigator.share === 'function' && (
            <button className="small-action-btn" onClick={handleShare} title="Share to another app">
              <Share2 size={14} />
            </button>
          )}

          {item.source !== 'pc' && (
            <button
              className="small-action-btn send-pc-btn"
              onClick={() => onSendToPC(item.text)}
              title="Push to PC clipboard (Ctrl+V)"
            >
              <Laptop size={14} />
              <span>Send to PC</span>
            </button>
          )}

          <button
            className={`primary-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
