import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(toast: Omit<Toast, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      dismissible: toast.dismissible ?? true,
    };

    update((toasts) => [...toasts, newToast]);

    // Auto dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }

    return id;
  }

  function dismiss(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  function clear() {
    update(() => []);
  }

  return {
    subscribe,
    add,
    dismiss,
    clear,
    success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => 
      add({ type: 'success', message, ...options }),
    error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => 
      add({ type: 'error', message, ...options }),
    warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => 
      add({ type: 'warning', message, ...options }),
    info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => 
      add({ type: 'info', message, ...options }),
  };
}

export const toastStore = createToastStore();
