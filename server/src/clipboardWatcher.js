import clipboardy from 'clipboardy';

export class ClipboardWatcher {
  constructor({ historyManager, onCopy, pollIntervalMs = 400 }) {
    this.historyManager = historyManager;
    this.onCopy = onCopy || (() => {});
    this.pollIntervalMs = pollIntervalMs;
    this.timer = null;
    this.isRunning = false;
    this.lastReadText = '';
    this.lastWrittenText = '';
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Seed the initial clipboard text to prevent re-copying existing content on boot
    try {
      this.lastReadText = (await clipboardy.read()) || '';
    } catch {
      this.lastReadText = '';
    }

    this._poll();
    console.log(`[ClipboardWatcher] Started silent clipboard watcher (interval: ${this.pollIntervalMs}ms)`);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[ClipboardWatcher] Stopped clipboard watcher');
  }

  async _poll() {
    if (!this.isRunning) return;

    try {
      const currentText = await clipboardy.read();

      if (
        currentText &&
        typeof currentText === 'string' &&
        currentText.trim().length > 0 &&
        currentText !== this.lastReadText
      ) {
        // If this text was just written by our own server (from a phone copy action), skip it
        if (currentText === this.lastWrittenText) {
          this.lastReadText = currentText;
          this.lastWrittenText = ''; // Reset
        } else {
          this.lastReadText = currentText;
          // Detected new copy on PC!
          const item = this.historyManager.addItem({
            text: currentText,
            source: 'pc'
          });

          if (item) {
            console.log(`[ClipboardWatcher] Captured PC copy: "${item.preview}" (${item.type})`);
            this.onCopy(item);
          }
        }
      }
    } catch (err) {
      // Windows clipboard can occasionally be locked by another app for <50ms.
      // Silently ignore temporary lock errors.
    }

    if (this.isRunning) {
      this.timer = setTimeout(() => this._poll(), this.pollIntervalMs);
    }
  }

  /**
   * Updates the Windows clipboard (e.g., when phone sends a copy event).
   * This allows Ctrl+V on PC to immediately paste the text from phone!
   */
  async writeToClipboard(text) {
    if (!text || typeof text !== 'string') return;
    try {
      this.lastWrittenText = text;
      this.lastReadText = text;
      await clipboardy.write(text);
      console.log(`[ClipboardWatcher] Windows clipboard updated from Phone: "${text.substring(0, 60)}..."`);
    } catch (err) {
      console.error('[ClipboardWatcher] Failed to write to clipboard:', err.message);
    }
  }
}
