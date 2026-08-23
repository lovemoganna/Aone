import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';

export type HandoffDataType = 'json' | 'csv' | 'tsv' | 'yaml' | 'text' | 'sql' | 'prompt' | 'curl';

export interface HandoffPayload {
    id: string;
    sourceTool: string;
    targetHref: string;
    dataType: HandoffDataType;
    payload: string;
    title?: string;
    metadata?: Record<string, any>;
    timestamp: number;
}

const STORAGE_KEY = 'aone_handoff_payload';

function createDataBridge() {
    const { subscribe, set, update } = writable<HandoffPayload | null>(null);

    // Initialize from sessionStorage on client
    if (typeof window !== 'undefined') {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                set(JSON.parse(stored));
            }
        } catch (e) {
            console.warn('Failed to load handoff payload from sessionStorage', e);
        }
    }

    return {
        subscribe,
        
        /**
         * Send data to another tool and optionally navigate there
         */
        send(
            sourceTool: string,
            targetHref: string,
            payload: {
                dataType: HandoffDataType;
                payload: string;
                title?: string;
                metadata?: Record<string, any>;
            },
            navigate: boolean = true
        ) {
            const handoffItem: HandoffPayload = {
                id: `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                sourceTool,
                targetHref,
                dataType: payload.dataType,
                payload: payload.payload,
                title: payload.title,
                metadata: payload.metadata,
                timestamp: Date.now()
            };

            set(handoffItem);

            if (typeof window !== 'undefined') {
                try {
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(handoffItem));
                } catch (e) {
                    console.warn('Failed to persist handoff payload', e);
                }
            }

            if (navigate && typeof window !== 'undefined') {
                goto(targetHref);
            }

            return handoffItem;
        },

        /**
         * Check and consume incoming handoff data for the current route
         */
        consume(currentHref: string): HandoffPayload | null {
            let current = get({ subscribe });
            
            // Check sessionStorage if memory is null
            if (!current && typeof window !== 'undefined') {
                try {
                    const stored = sessionStorage.getItem(STORAGE_KEY);
                    if (stored) {
                        current = JSON.parse(stored);
                    }
                } catch (e) {
                    // Ignore
                }
            }

            if (current && (current.targetHref === currentHref || current.targetHref === '*' || currentHref.startsWith(current.targetHref))) {
                // Clear after consuming
                set(null);
                if (typeof window !== 'undefined') {
                    try {
                        sessionStorage.removeItem(STORAGE_KEY);
                    } catch (e) {}
                }
                return current;
            }

            return null;
        },

        /**
         * Clear active handoff payload
         */
        clear() {
            set(null);
            if (typeof window !== 'undefined') {
                try {
                    sessionStorage.removeItem(STORAGE_KEY);
                } catch (e) {}
            }
        }
    };
}

export const dataBridge = createDataBridge();
