/**
 * hotkeys.ts - Utility to handle common keyboard shortcuts
 */

type HotkeyAction = () => void;

interface HotkeyMap {
    [key: string]: HotkeyAction;
}

/**
 * Parses a combination string like "ctrl+s", "meta+z", "ctrl+shift+z"
 */
export function handleHotkeys(event: KeyboardEvent, map: HotkeyMap) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const key = event.key.toLowerCase();
    
    // Build combo string
    let combo = [];
    if (event.ctrlKey || (isMac && event.metaKey)) combo.push('ctrl');
    if (event.shiftKey) combo.push('shift');
    if (event.altKey) combo.push('alt');
    
    // Add the main key if it's not a modifier itself
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        combo.push(key);
    }
    
    const comboStr = combo.join('+');
    
    if (map[comboStr]) {
        event.preventDefault();
        map[comboStr]();
    }
}
