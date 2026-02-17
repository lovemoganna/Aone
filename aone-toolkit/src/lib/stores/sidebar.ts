import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createSidebarStore() {
    const getInitialState = (): boolean => {
        if (!browser) return false;
        return localStorage.getItem('sidebar-collapsed') === 'true';
    };

    const { subscribe, set, update } = writable<boolean>(getInitialState());

    return {
        subscribe,
        toggle: () => {
            update((current) => {
                const next = !current;
                if (browser) {
                    localStorage.setItem('sidebar-collapsed', String(next));
                }
                return next;
            });
        },
        collapse: () => {
            if (browser) localStorage.setItem('sidebar-collapsed', 'true');
            set(true);
        },
        expand: () => {
            if (browser) localStorage.setItem('sidebar-collapsed', 'false');
            set(false);
        }
    };
}

export const sidebarCollapsed = createSidebarStore();
