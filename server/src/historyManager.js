import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectContentType } from './utils/detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'history.json');

const MAX_HISTORY_LIMIT = 500;

export class HistoryManager {
  constructor() {
    this.items = [];
    this.saveTimeout = null;
    this._ensureStorage();
    this._load();
  }

  _ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  _load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed.slice(0, MAX_HISTORY_LIMIT);
        }
      }
    } catch (err) {
      console.error('[HistoryManager] Error loading history from file:', err.message);
      this.items = [];
    }
  }

  _scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.items, null, 2), 'utf-8');
      } catch (err) {
        console.error('[HistoryManager] Error saving history:', err.message);
      }
    }, 500);
  }

  /**
   * Add a new clipboard text entry.
   * Enforces the 500 items limit while preserving pinned entries.
   */
  addItem({ text, source = 'pc', isPinned = false }) {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (trimmed.length === 0) return null;

    // Deduplicate against the most recent entry
    if (this.items.length > 0 && this.items[0].text === text) {
      return this.items[0]; // Already the latest item
    }

    const type = detectContentType(text);
    const newItem = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text,
      preview: trimmed.length > 120 ? trimmed.substring(0, 120) + '...' : trimmed,
      type,
      source, // 'pc' | 'phone'
      isPinned: Boolean(isPinned),
      charCount: text.length,
      lineCount: text.split('\n').length,
      timestamp: new Date().toISOString()
    };

    // Insert at the front (most recent first)
    this.items.unshift(newItem);

    // Enforce 500 items limit (preserving pinned items)
    if (this.items.length > MAX_HISTORY_LIMIT) {
      // Find oldest unpinned item to drop
      let excess = this.items.length - MAX_HISTORY_LIMIT;
      for (let i = this.items.length - 1; i >= 0 && excess > 0; i--) {
        if (!this.items[i].isPinned) {
          this.items.splice(i, 1);
          excess--;
        }
      }
      // If still over limit (all 500+ items are pinned), trim the oldest item
      if (this.items.length > MAX_HISTORY_LIMIT) {
        this.items = this.items.slice(0, MAX_HISTORY_LIMIT);
      }
    }

    this._scheduleSave();
    return newItem;
  }

  togglePin(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.isPinned = !item.isPinned;
      this._scheduleSave();
      return item;
    }
    return null;
  }

  deleteItem(id) {
    const index = this.items.findIndex(i => i.id === id);
    if (index !== -1) {
      const removed = this.items.splice(index, 1)[0];
      this._scheduleSave();
      return removed;
    }
    return null;
  }

  clear(keepPinned = true) {
    if (keepPinned) {
      this.items = this.items.filter(i => i.isPinned);
    } else {
      this.items = [];
    }
    this._scheduleSave();
    return this.items;
  }

  getItems({ search = '', type = 'all', limit = MAX_HISTORY_LIMIT } = {}) {
    let result = this.items;

    if (type && type !== 'all') {
      if (type === 'pinned') {
        result = result.filter(i => i.isPinned);
      } else {
        result = result.filter(i => i.type === type);
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(i => i.text.toLowerCase().includes(q));
    }

    return result.slice(0, limit);
  }

  getStats() {
    return {
      total: this.items.length,
      maxLimit: MAX_HISTORY_LIMIT,
      pinnedCount: this.items.filter(i => i.isPinned).length,
      types: {
        url: this.items.filter(i => i.type === 'url').length,
        code: this.items.filter(i => i.type === 'code').length,
        text: this.items.filter(i => i.type === 'text').length,
        email: this.items.filter(i => i.type === 'email').length,
        phone: this.items.filter(i => i.type === 'phone').length,
      }
    };
  }
}
