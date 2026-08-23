// ============================================================================
// Multi-Agent IndexedDB Persistence Service
// High-capacity, non-volatile async storage for multi-agent sessions & history
// ============================================================================

import type { Session, SessionHistoryItem, PipelineState, Checkpoint } from "$lib/stores/agentStore.svelte";

const DB_NAME = "aone_multiagent_db";
const DB_VERSION = 1;
const STORE_HISTORY = "history_sessions";
const STORE_ACTIVE = "active_session";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDBAvailable(): boolean {
    return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

export function getAgentDB(): Promise<IDBDatabase | null> {
    if (!isIndexedDBAvailable()) {
        return Promise.resolve(null);
    }

    if (dbPromise) return dbPromise;

    dbPromise = new Promise<IDBDatabase | null>((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.warn("[AgentIndexedDB] Failed to open IndexedDB:", request.error);
                resolve(null);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // History Sessions Store
                if (!db.objectStoreNames.contains(STORE_HISTORY)) {
                    const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: "id" });
                    historyStore.createIndex("timestamp", "timestamp", { unique: false });
                    historyStore.createIndex("sessionId", "sessionId", { unique: false });
                }

                // Active Live Session State Store
                if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
                    db.createObjectStore(STORE_ACTIVE, { keyPath: "id" });
                }
            };
        } catch (e) {
            console.warn("[AgentIndexedDB] Exception opening IndexedDB:", e);
            resolve(null);
        }
    });

    return dbPromise;
}

// ----------------------------------------------------------------------------
// History Sessions Management
// ----------------------------------------------------------------------------

export async function saveHistoryToIDB(item: SessionHistoryItem): Promise<void> {
    const db = await getAgentDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(STORE_HISTORY, "readwrite");
            const store = tx.objectStore(STORE_HISTORY);
            const req = store.put(JSON.parse(JSON.stringify(item)));

            req.onsuccess = () => resolve();
            req.onerror = () => {
                console.warn("[AgentIndexedDB] Error saving history item:", req.error);
                resolve();
            };
        } catch (e) {
            console.warn("[AgentIndexedDB] Transaction error in saveHistoryToIDB:", e);
            resolve();
        }
    });
}

export async function loadAllHistoryFromIDB(): Promise<SessionHistoryItem[]> {
    const db = await getAgentDB();
    if (!db) return [];

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_HISTORY, "readonly");
            const store = tx.objectStore(STORE_HISTORY);
            const req = store.getAll();

            req.onsuccess = () => {
                const results = (req.result || []) as SessionHistoryItem[];
                results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                resolve(results);
            };
            req.onerror = () => {
                console.warn("[AgentIndexedDB] Error loading all history:", req.error);
                resolve([]);
            };
        } catch (e) {
            console.warn("[AgentIndexedDB] Transaction error in loadAllHistoryFromIDB:", e);
            resolve([]);
        }
    });
}

export async function deleteHistoryFromIDB(id: string): Promise<void> {
    const db = await getAgentDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_HISTORY, "readwrite");
            const store = tx.objectStore(STORE_HISTORY);
            const req = store.delete(id);

            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}

export async function clearAllHistoryFromIDB(): Promise<void> {
    const db = await getAgentDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_HISTORY, "readwrite");
            const store = tx.objectStore(STORE_HISTORY);
            const req = store.clear();

            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}

// ----------------------------------------------------------------------------
// Active Session Live State Persistence (for seamless page refresh restore)
// ----------------------------------------------------------------------------

export interface ActiveSessionSnapshot {
    id: string; // always "active_current"
    timestamp: number;
    session: Session;
    goal?: string;
    pipelineState?: Partial<PipelineState>;
    checkpoint?: Checkpoint | null;
}

export async function saveActiveSessionToIDB(
    session: Session,
    goal?: string,
    pipelineState?: Partial<PipelineState>,
    checkpoint?: Checkpoint | null
): Promise<void> {
    const db = await getAgentDB();
    if (!db) return;

    const payload: ActiveSessionSnapshot = {
        id: "active_current",
        timestamp: Date.now(),
        session: JSON.parse(JSON.stringify(session)),
        goal,
        pipelineState: pipelineState ? JSON.parse(JSON.stringify(pipelineState)) : undefined,
        checkpoint: checkpoint ? JSON.parse(JSON.stringify(checkpoint)) : undefined,
    };

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_ACTIVE, "readwrite");
            const store = tx.objectStore(STORE_ACTIVE);
            const req = store.put(payload);

            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}

export async function loadActiveSessionFromIDB(): Promise<ActiveSessionSnapshot | null> {
    const db = await getAgentDB();
    if (!db) return null;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_ACTIVE, "readonly");
            const store = tx.objectStore(STORE_ACTIVE);
            const req = store.get("active_current");

            req.onsuccess = () => {
                resolve((req.result as ActiveSessionSnapshot) || null);
            };
            req.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

export async function clearActiveSessionFromIDB(): Promise<void> {
    const db = await getAgentDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_ACTIVE, "readwrite");
            const store = tx.objectStore(STORE_ACTIVE);
            const req = store.delete("active_current");

            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}
