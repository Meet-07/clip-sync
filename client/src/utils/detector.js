export function detectContentType(text) {
  if (!text || typeof text !== 'string') return 'text';
  const trimmed = text.trim();

  // URL
  const urlRegex = /^(https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*$/i;
  if (urlRegex.test(trimmed)) return 'url';

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) return 'email';

  // Phone
  const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/;
  if (phoneRegex.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7) return 'phone';

  // Code
  const codeIndicators = [
    /^(const|let|var|function|class|import|export|def|return|if|for|while|switch|case)\s+/m,
    /[{};<>]=|=>|===|!==|console\.log|print\(|\bSystem\.out|\bSELECT\s+.+\s+FROM\b/i,
    /^\s*<(!DOCTYPE|html|div|span|script|style|body|p|button|a)\b/i,
    /(\{|\}\s*$|;\s*$)/m
  ];

  const hasMultipleLines = trimmed.includes('\n');
  const codeMatches = codeIndicators.filter(regex => regex.test(trimmed)).length;

  if (codeMatches >= 2 || (hasMultipleLines && codeMatches >= 1)) {
    return 'code';
  }

  return 'text';
}

export function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const past = new Date(isoString);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
