"use client";

// Minimal IndexedDB-backed key/value storage implementing zustand's
// StateStorage (async getItem/setItem/removeItem). Used instead of
// localStorage because we persist generated images as base64 data URLs, which
// blow past localStorage's ~5MB cap. IndexedDB has a far larger quota.
// No dependency — a tiny promisified wrapper around one object store.

import type { StateStorage } from "zustand/middleware";

const DB_NAME = "prototype-studio-db";
const STORE = "keyval";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const store = db.transaction(STORE, mode).objectStore(STORE);
        const req = run(store);
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      })
  );
}

// Server / non-browser fallback: a no-op store so SSR and tests don't crash.
const noop: StateStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const idb: StateStorage = {
  getItem: (name) => tx<string | null>("readonly", (s) => s.get(name)).then((v) => v ?? null),
  setItem: (name, value) => tx("readwrite", (s) => s.put(value, name)).then(() => undefined),
  removeItem: (name) => tx("readwrite", (s) => s.delete(name)).then(() => undefined),
};

export const idbStorage: StateStorage =
  typeof indexedDB !== "undefined" ? idb : noop;
