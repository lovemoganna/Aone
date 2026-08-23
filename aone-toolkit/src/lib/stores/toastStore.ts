import { writable } from 'svelte/store';

export interface Toast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    return {
        subscribe,
        add: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) => {
            const id = crypto.randomUUID();
            const toast: Toast = { id, message, type, duration };

            update(toasts => [...toasts, toast]);

            setTimeout(() => {
                update(toasts => toasts.filter(t => t.id !== id));
            }, duration);
        },
        info: (msg: string) => add(msg, 'info'),
        success: (msg: string) => add(msg, 'success'),
        warning: (msg: string) => add(msg, 'warning'),
        error: (msg: string) => add(msg, 'error'),
    };

    function add(message: string, type: 'info' | 'success' | 'warning' | 'error', duration = 2000) {
        const id = crypto.randomUUID();
        const toast: Toast = { id, message, type, duration };

        update(toasts => [...toasts, toast]);

        setTimeout(() => {
            update(toasts => toasts.filter(t => t.id !== id));
        }, duration);
    }
}

export const toastStore = createToastStore();
