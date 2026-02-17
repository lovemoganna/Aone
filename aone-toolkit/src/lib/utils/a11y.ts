// Accessibility utilities for ARIA support

// Generate unique IDs for ARIA
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Common ARIA roles
export const ARIA_ROLES = {
  BUTTON: 'button',
  COMBOBOX: 'combobox',
  DIALOG: 'dialog',
  GRID: 'grid',
  LISTBOX: 'listbox',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  OPTION: 'option',
  RADIO: 'radio',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEITEM: 'treeitem',
} as const;

// ARIA attributes helpers
export function ariaLabel(label: string): { 'aria-label': string } {
  return { 'aria-label': label };
}

export function ariaDescribedBy(id: string): { 'aria-describedby': string } {
  return { 'aria-describedby': id };
}

export function ariaLabelledBy(id: string): { 'aria-labelledby': string } {
  return { 'aria-labelledby': id };
}

export function ariaOwns(id: string): { 'aria-owns': string } {
  return { 'aria-owns': id };
}

export function ariaExpanded(isExpanded: boolean): { 'aria-expanded': boolean } {
  return { 'aria-expanded': isExpanded };
}

export function ariaChecked(isChecked: boolean): { 'aria-checked': boolean } {
  return { 'aria-checked': isChecked };
}

export function ariaDisabled(isDisabled: boolean): { 'aria-disabled': boolean } {
  return { 'aria-disabled': isDisabled };
}

export function ariaSelected(isSelected: boolean): { 'aria-selected': boolean } {
  return { 'aria-selected': isSelected };
}

export function ariaHidden(isHidden: boolean): { 'aria-hidden': boolean } {
  return { 'aria-hidden': isHidden };
}

export function ariaCurrent(state?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean): { 'aria-current'?: string | boolean } {
  return { 'aria-current': state };
}

export function ariaLive(
  politeness: 'polite' | 'assertive' | 'off' = 'polite'
): { 'aria-live': string } {
  return { 'aria-live': politeness };
}

export function ariaPressed(isPressed: boolean): { 'aria-pressed': boolean } {
  return { 'aria-pressed': isPressed };
}

export function ariaRequired(isRequired: boolean): { 'aria-required': boolean } {
  return { 'aria-required': isRequired };
}

export function ariaValueNow(value: number): { 'aria-valuenow': number } {
  return { 'aria-valuenow': value };
}

export function ariaValueMin(min: number): { 'aria-valuemin': number } {
  return { 'aria-valuemin': min };
}

export function ariaValueMax(max: number): { 'aria-valuemax': number } {
  return { 'aria-valuemax': max };
}

export function ariaValueText(text: string): { 'aria-valuetext': string } {
  return { 'aria-valuetext': text };
}

// Role attribute helpers
export function role(r: string): { role: string } {
  return { role: r };
}

// Focus management
export function getActiveElement(): Element | null {
  return document.activeElement;
}

export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input') return (element as HTMLInputElement).type !== 'hidden';
  if (tagName === 'select') return !(element as HTMLSelectElement).disabled;
  if (tagName === 'textarea') return !(element as HTMLTextAreaElement).disabled;
  if (tagName === 'button') return !(element as HTMLButtonElement).disabled;
  
  return true;
}

export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  return focusable[0] || null;
}

export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  return focusable[focusable.length - 1] || null;
}

export function focusFirst(container: HTMLElement): boolean {
  const first = getFirstFocusable(container);
  if (first) {
    first.focus();
    return true;
  }
  return false;
}

export function focusLast(container: HTMLElement): boolean {
  const last = getLastFocusable(container);
  if (last) {
    last.focus();
    return true;
  }
  return false;
}

// Keyboard navigation helpers
export function isArrowKey(key: string): boolean {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
}

export function isModifierKey(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
}

export function getArrowDirection(key: string): 'up' | 'down' | 'left' | 'right' | null {
  switch (key) {
    case 'ArrowUp': return 'up';
    case 'ArrowDown': return 'down';
    case 'ArrowLeft': return 'left';
    case 'ArrowRight': return 'right';
    default: return null;
  }
}

// Announce to screen readers
export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', politeness);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

// Check if reduced motion is preferred
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}
