import React from 'react';
import { CheckCircle, RefreshCw, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export function Toast({ toast }) {
  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={16} className="toast-icon success" />;
      case 'sync': return <RefreshCw size={16} className="toast-icon sync" />;
      case 'warning': return <AlertTriangle size={16} className="toast-icon warning" />;
      case 'error': return <AlertCircle size={16} className="toast-icon error" />;
      default: return <Info size={16} className="toast-icon info" />;
    }
  };

  return (
    <div className={`toast-banner toast-${toast.type || 'info'}`}>
      {getIcon()}
      <span className="toast-text">{toast.text}</span>
    </div>
  );
}
