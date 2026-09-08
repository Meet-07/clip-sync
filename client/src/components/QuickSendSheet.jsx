import React, { useState } from 'react';
import { Send, Clipboard, X, Laptop } from 'lucide-react';

export function QuickSendSheet({ isOpen, onClose, onSendToPC }) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    onSendToPC(text.trim());
    setText('');
    onClose();
  };

  const handlePasteFromPhone = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip) {
          setText(clip);
        }
      }
    } catch (err) {
      // Permission denied or not supported in this context
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-modal" onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <div className="sheet-title-group">
            <Laptop size={18} className="text-accent" />
            <h3 className="sheet-title">Send Text to PC Clipboard</h3>
          </div>
          <button className="sheet-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="sheet-description">
          Text entered here will be immediately set to your PC's clipboard. You can press <strong>Ctrl+V</strong> on PC right away!
        </p>

        <div className="sheet-input-wrapper">
          <textarea
            className="sheet-textarea"
            placeholder="Type or paste text to send to PC..."
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="sheet-actions">
          {typeof navigator.clipboard?.readText === 'function' && (
            <button className="paste-phone-btn" onClick={handlePasteFromPhone}>
              <Clipboard size={15} />
              <span>Paste from Phone</span>
            </button>
          )}

          <div style={{ flex: 1 }} />

          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>

          <button
            className="send-btn"
            disabled={!text.trim()}
            onClick={handleSend}
          >
            <Send size={15} />
            <span>Send to PC</span>
          </button>
        </div>
      </div>
    </div>
  );
}
