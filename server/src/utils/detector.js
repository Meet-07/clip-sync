/**
 * Detects the type of content in a clipboard string.
 * Categorizes into: 'url', 'email', 'phone', 'code', or 'text'.
 */
export function detectContentType(text) {
  if (!text || typeof text !== 'string') return 'text';
  const trimmed = text.trim();

  // URL detection
  const urlRegex = /^(https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*$/i;
  if (urlRegex.test(trimmed)) {
    return 'url';
  }

  // Email detection
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return 'email';
  }

  // Phone number (e.g. +123456789, (123) 456-7890)
  const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/;
  if (phoneRegex.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7) {
    return 'phone';
  }

  // Code snippet detection (heuristics: curly braces, indentation, syntax keywords)
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
