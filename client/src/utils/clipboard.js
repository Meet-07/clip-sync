/**
 * Robust cross-browser clipboard copy with fallback for non-secure HTTP contexts.
 * When accessing via local IP (e.g. http://192.168.x.x:7331), navigator.clipboard
 * may be unavailable. This fallback ensures 100% copy success on mobile.
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;

  // Modern Async Clipboard API (works on localhost, HTTPS, and modern browsers)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting fallback...', err);
    }
  }

  // Reliable fallback via textarea + document.execCommand('copy')
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Position out of viewport
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);

    // Focus and select range (works on iOS Safari and Android Chrome)
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('All clipboard copy methods failed:', err);
    return false;
  }
}
