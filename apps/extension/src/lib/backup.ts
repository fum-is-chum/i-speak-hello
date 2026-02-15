/**
 * Data backup and restore utilities.
 * Uses IndexedDB for auto-backup (survives extension uninstall)
 * and JSON export/import for manual backup.
 */

const DB_NAME = 'i-speak-hello-backup';
const DB_VERSION = 1;
const STORE_NAME = 'backups';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export interface BackupData {
  words: unknown[];
  settings: unknown;
  streak: unknown;
  reviews: unknown[];
  seeded: boolean;
  backupAt: number;
  version: string;
}

/**
 * Export all data from chrome.storage.local as a BackupData object.
 */
export async function exportData(): Promise<BackupData> {
  const data = await chrome.storage.local.get(null);
  return {
    words: data.words || [],
    settings: data.settings || null,
    streak: data.streak || null,
    reviews: data.reviews || [],
    seeded: !!data.seeded,
    backupAt: Date.now(),
    version: '1.0.0',
  };
}

/**
 * Import data into chrome.storage.local from a BackupData object.
 * Validates the data structure before restoring.
 */
export async function importData(data: BackupData): Promise<void> {
  if (!data || typeof data !== 'object') {
    throw new Error('Data backup tidak valid');
  }

  if (!Array.isArray(data.words)) {
    throw new Error('Data kata tidak valid');
  }

  const toStore: Record<string, unknown> = {};

  if (data.words.length > 0) toStore.words = data.words;
  if (data.settings) toStore.settings = data.settings;
  if (data.streak) toStore.streak = data.streak;
  if (data.reviews && data.reviews.length > 0) toStore.reviews = data.reviews;
  if (data.seeded) toStore.seeded = true;

  await chrome.storage.local.set(toStore);
}

/**
 * Save a backup snapshot to IndexedDB (auto-backup).
 * This persists even if the extension is uninstalled.
 */
export async function autoBackup(): Promise<void> {
  try {
    const data = await exportData();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, 'lastBackup');
    store.put(Date.now(), 'lastBackupTimestamp');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('[I Speak Hello] Auto-backup failed:', err);
  }
}

/**
 * Get the last auto-backup from IndexedDB.
 */
export async function getLastBackup(): Promise<BackupData | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('lastBackup');
    const result = await new Promise<BackupData | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

/**
 * Get the timestamp of the last auto-backup.
 */
export async function getLastBackupTimestamp(): Promise<number | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('lastBackupTimestamp');
    const result = await new Promise<number | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

/**
 * Download backup data as a JSON file.
 */
export function downloadBackupFile(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `i-speak-hello-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read a backup file and parse it.
 */
export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        resolve(data);
      } catch {
        reject(new Error('File bukan JSON yang valid'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}
