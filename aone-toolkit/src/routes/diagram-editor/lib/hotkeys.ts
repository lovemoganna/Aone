export interface HotkeyBinding {
    id: string;
    key: string;
    ctrlOrMeta?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    category: 'Editor' | 'Canvas' | 'Project' | 'Export';
}

export const DEFAULT_HOTKEYS: HotkeyBinding[] = [
    { id: 'render', key: 'Enter', ctrlOrMeta: true, description: 'Re-render diagram', category: 'Editor' },
    { id: 'save', key: 's', ctrlOrMeta: true, description: 'Save diagram snapshot', category: 'Editor' },
    { id: 'command-palette', key: 'k', ctrlOrMeta: true, description: 'Open command palette', category: 'Editor' },
    { id: 'find-replace', key: 'f', ctrlOrMeta: true, description: 'Find and replace', category: 'Editor' },
    { id: 'new-doc', key: 'n', ctrlOrMeta: true, description: 'Create new document', category: 'Project' },
    { id: 'export-modal', key: 'e', ctrlOrMeta: true, description: 'Open export dialog', category: 'Export' },
    { id: 'copy-image', key: 'c', ctrlOrMeta: true, shift: true, description: 'Copy image to clipboard', category: 'Export' },
    { id: 'fit-view', key: '0', ctrlOrMeta: true, description: 'Fit diagram to screen', category: 'Canvas' },
    { id: 'history', key: 'h', ctrlOrMeta: true, description: 'Open history snapshots', category: 'Project' },
    { id: 'shortcuts', key: '/', ctrlOrMeta: true, description: 'Show keyboard shortcuts', category: 'Editor' }
];

export class HotkeyEngine {
    bindings: HotkeyBinding[] = [...DEFAULT_HOTKEYS];

    handleKeyDown(e: KeyboardEvent, onAction: (actionId: string) => void): boolean {
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const isAlt = e.altKey;

        for (const binding of this.bindings) {
            const matchesKey = e.key.toLowerCase() === binding.key.toLowerCase();
            const matchesCtrl = binding.ctrlOrMeta ? isCtrlOrMeta : !isCtrlOrMeta;
            const matchesShift = binding.shift ? isShift : !isShift;
            const matchesAlt = binding.alt ? isAlt : !isAlt;

            if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                onAction(binding.id);
                return true;
            }
        }
        return false;
    }
}

export const hotkeyEngine = new HotkeyEngine();
