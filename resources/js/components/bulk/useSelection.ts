import { useCallback, useState } from 'react';

/**
 * Generic checkbox-selection state for bulk actions.
 * Keys are the stringified row key (e.g. `String(id)`).
 */
export function useSelection() {
    const [selected, setSelected] = useState<Set<string>>(() => new Set());

    const toggle = useCallback((key: string, enabled: boolean) => {
        if (!enabled) return;
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const toggleAll = useCallback((keys: string[]) => {
        setSelected((prev) => {
            const next = new Set(prev);
            const visible = new Set(keys);
            for (const k of Array.from(next)) {
                if (!visible.has(k)) next.delete(k);
            }
            const allSelected = keys.length > 0 && keys.every((k) => next.has(k));
            if (allSelected) {
                keys.forEach((k) => next.delete(k));
            } else {
                keys.forEach((k) => next.add(k));
            }
            return next;
        });
    }, []);

    const clear = useCallback(() => setSelected(new Set()), []);

    return { selected, toggle, toggleAll, clear, count: selected.size };
}