import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createSidebarStore() {
    const getInitialState = (): boolean => {
        if (!browser) return true;
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === null) return true; // 默认隐藏/折叠左侧侧边栏
        return stored === 'true';
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
