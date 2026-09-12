import type { SavedDniRecord, CensorBox, CensorStyle } from '../types/dni';

const DB_NAME = 'pasadni_db';
const DB_VERSION = 1;
const STORE_NAME = 'saved_dnis';

/**
 * Initializes and returns the IndexedDB database instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('side', 'side', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error al abrir la base de datos local.'));
  });
}

/**
 * Retrieves all saved DNI records sorted by most recently updated
 */
export async function getAllSavedDnis(): Promise<SavedDniRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result as SavedDniRecord[]) || [];
      // Sort newest first
      results.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(results);
    };

    request.onerror = () => reject(request.error || new Error('Error al leer DNIs guardados.'));
  });
}

/**
 * Retrieves a single saved DNI record by ID
 */
export async function getSavedDniById(id: string): Promise<SavedDniRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as SavedDniRecord) || null);
    request.onerror = () => reject(request.error || new Error(`Error al buscar DNI ${id}.`));
  });
}

/**
 * Saves or updates a DNI record in IndexedDB
 */
export async function saveDniRecord(
  record: {
    id?: string;
    title: string;
    side?: 'front' | 'back' | 'custom';
    imageDataUrl: string;
    thumbnailUrl?: string;
    boxes: CensorBox[];
    censorStyle: CensorStyle;
  }
): Promise<SavedDniRecord> {
  const db = await openDB();
  const now = Date.now();
  const id = record.id || `dni-${now}`;
  const side = record.side || 'front';

  // If thumbnail isn't provided, we generate a placeholder or use dataUrl
  const thumbnailUrl = record.thumbnailUrl || record.imageDataUrl;

  const savedRecord: SavedDniRecord = {
    id,
    title: record.title,
    side,
    imageDataUrl: record.imageDataUrl,
    thumbnailUrl,
    boxes: record.boxes,
    censorStyle: record.censorStyle,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(savedRecord);

    request.onsuccess = () => resolve(savedRecord);
    request.onerror = () => reject(request.error || new Error('Error al guardar el DNI en el almacenamiento local.'));
  });
}

/**
 * Deletes a single saved DNI record
 */
export async function deleteSavedDni(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error(`Error al eliminar DNI ${id}.`));
  });
}

/**
 * Wipes all saved DNI records (Zero-Trust full cleanup)
 */
export async function clearAllSavedDnis(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Error al vaciar los datos guardados.'));
  });
}

/**
 * Converts an HTMLImageElement to a base64 DataURL (JPEG)
 */
export function imageToDataUrl(img: HTMLImageElement, quality = 0.92): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar canvas 2D para convertir la imagen.');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Generates a lightweight preview thumbnail (max 320px width)
 */
export function generateThumbnail(
  source: HTMLImageElement | HTMLCanvasElement,
  maxWidth = 320
): string {
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;

  const scale = Math.min(1, maxWidth / width);
  const thumbWidth = Math.round(width * scale);
  const thumbHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = thumbWidth;
  canvas.height = thumbHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(source, 0, 0, thumbWidth, thumbHeight);
  return canvas.toDataURL('image/jpeg', 0.80);
}

/**
 * Reconstructs an HTMLImageElement from a DataURL
 */
export function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen desde el almacenamiento local.'));
    img.src = dataUrl;
  });
}
