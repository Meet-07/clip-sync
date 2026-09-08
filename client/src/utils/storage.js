/**
 * IndexedDB storage helper for storing up to 500 clipboard items permanently on mobile.
 */
const DB_NAME = 'ClipSyncDB';
const DB_VERSION = 1;
const STORE_NAME = 'clipboard_history';
const MAX_LOCAL_ITEMS = 500;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return resolve(null); // Fallback to localStorage
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => {
      console.warn('IndexedDB error, falling back to localStorage:', event.target.error);
      resolve(null);
    };
  });
}

export async function saveHistoryToLocal(items) {
  try {
    const limited = items.slice(0, MAX_LOCAL_ITEMS);
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await new Promise(res => {
        const clearReq = store.clear();
        clearReq.onsuccess = res;
      });
      for (const item of limited) {
        store.put(item);
      }
    } else {
      localStorage.setItem(STORE_NAME, JSON.stringify(limited));
    }
  } catch (err) {
    try {
      localStorage.setItem(STORE_NAME, JSON.stringify(items.slice(0, MAX_LOCAL_ITEMS)));
    } catch {}
  }
}

export async function loadHistoryFromLocal() {
  try {
    const db = await openDB();
    if (db) {
      return new Promise(resolve => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = req.result || [];
          // Sort most recent first
          items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(items.slice(0, MAX_LOCAL_ITEMS));
        };
        req.onerror = () => resolve(_loadFromLocalStorage());
      });
    }
    return _loadFromLocalStorage();
  } catch {
    return _loadFromLocalStorage();
  }
}

function _loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORE_NAME);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_LOCAL_ITEMS) : [];
  } catch {
    return [];
  }
}
