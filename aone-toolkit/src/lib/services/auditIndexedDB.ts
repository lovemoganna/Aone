/**
 * auditIndexedDB.ts
 * 
 * IndexedDB persistence layer for audit events.
 * Extends the existing agentIndexedDB pattern.
 */

import type { AuditEvent } from '$lib/stores/auditEventBus.svelte';

const DB_NAME = 'aone_audit_db';
const DB_VERSION = 1;
const STORE_EVENTS = 'audit_events';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

export function getAuditDB(): Promise<IDBDatabase | null> {
    if (!isIndexedDBAvailable()) {
        return Promise.resolve(null);
    }

    if (dbPromise) return dbPromise;

    dbPromise = new Promise<IDBDatabase | null>((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.warn('[AuditIndexedDB] Failed to open IndexedDB:', request.error);
                resolve(null);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(STORE_EVENTS)) {
                    const store = db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
                    store.createIndex('sessionId', 'sessionId', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
            };
        } catch (e) {
            console.warn('[AuditIndexedDB] Exception opening IndexedDB:', e);
            resolve(null);
        }
    });

    return dbPromise;
}

// ─── Save Events ────────────────────────────────────────────────────────────

export async function saveAuditEvent(event: AuditEvent): Promise<void> {
    const db = await getAuditDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readwrite');
            const store = tx.objectStore(STORE_EVENTS);
            const req = store.put(JSON.parse(JSON.stringify(event)));

            req.onsuccess = () => resolve();
            req.onerror = () => {
                console.warn('[AuditIndexedDB] Error saving audit event:', req.error);
                resolve();
            };
        } catch (e) {
            console.warn('[AuditIndexedDB] Transaction error in saveAuditEvent:', e);
            resolve();
        }
    });
}

export async function saveAuditEvents(events: AuditEvent[]): Promise<void> {
    const db = await getAuditDB();
    if (!db || events.length === 0) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readwrite');
            const store = tx.objectStore(STORE_EVENTS);

            for (const event of events) {
                store.put(JSON.parse(JSON.stringify(event)));
            }

            tx.oncomplete = () => resolve();
            tx.onerror = () => {
                console.warn('[AuditIndexedDB] Error in batch save:', tx.error);
                resolve();
            };
        } catch (e) {
            console.warn('[AuditIndexedDB] Transaction error in saveAuditEvents:', e);
            resolve();
        }
    });
}

// ─── Load Events ────────────────────────────────────────────────────────────

export async function loadAuditEventsBySession(sessionId: string): Promise<AuditEvent[]> {
    const db = await getAuditDB();
    if (!db) return [];

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readonly');
            const store = tx.objectStore(STORE_EVENTS);
            const index = store.index('sessionId');
            const req = index.getAll(sessionId);

            req.onsuccess = () => {
                const results = (req.result || []) as AuditEvent[];
                results.sort((a, b) => a.timestamp - b.timestamp);
                resolve(results);
            };
            req.onerror = () => {
                console.warn('[AuditIndexedDB] Error loading audit events:', req.error);
                resolve([]);
            };
        } catch (e) {
            console.warn('[AuditIndexedDB] Transaction error in loadAuditEventsBySession:', e);
            resolve([]);
        }
    });
}

export async function loadAllAuditEvents(): Promise<AuditEvent[]> {
    const db = await getAuditDB();
    if (!db) return [];

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readonly');
            const store = tx.objectStore(STORE_EVENTS);
            const req = store.getAll();

            req.onsuccess = () => {
                const results = (req.result || []) as AuditEvent[];
                results.sort((a, b) => a.timestamp - b.timestamp);
                resolve(results);
            };
            req.onerror = () => {
                console.warn('[AuditIndexedDB] Error loading all audit events:', req.error);
                resolve([]);
            };
        } catch (e) {
            console.warn('[AuditIndexedDB] Transaction error in loadAllAuditEvents:', e);
            resolve([]);
        }
    });
}

// ─── Delete Events ──────────────────────────────────────────────────────────

export async function deleteAuditEventsBySession(sessionId: string): Promise<void> {
    const db = await getAuditDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readwrite');
            const store = tx.objectStore(STORE_EVENTS);
            const index = store.index('sessionId');
            const req = index.openCursor(sessionId);

            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}

export async function clearAllAuditEvents(): Promise<void> {
    const db = await getAuditDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readwrite');
            const store = tx.objectStore(STORE_EVENTS);
            const req = store.clear();

            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}

// ─── Statistics ─────────────────────────────────────────────────────────────

export async function getAuditSessionIds(): Promise<string[]> {
    const db = await getAuditDB();
    if (!db) return [];

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readonly');
            const store = tx.objectStore(STORE_EVENTS);
            const index = store.index('sessionId');
            const req = index.openKeyCursor(null, 'nextunique');
            const sessionIds: string[] = [];

            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    sessionIds.push(cursor.key as string);
                    cursor.continue();
                } else {
                    resolve(sessionIds);
                }
            };
            req.onerror = () => resolve([]);
        } catch {
            resolve([]);
        }
    });
}

export async function getAuditEventCount(sessionId?: string): Promise<number> {
    const db = await getAuditDB();
    if (!db) return 0;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_EVENTS, 'readonly');
            const store = tx.objectStore(STORE_EVENTS);

            if (sessionId) {
                const index = store.index('sessionId');
                const req = index.count(sessionId);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(0);
            } else {
                const req = store.count();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(0);
            }
        } catch {
            resolve(0);
        }
    });
}
