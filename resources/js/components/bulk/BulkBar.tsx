import { ReactNode } from 'react';
import Button from '../ui/Button';

interface BulkBarProps {
    count: number;
    onClear: () => void;
    children?: ReactNode;
}

/** Toolbar shown when rows are selected for bulk actions. */
export function BulkBar({ count, onClear, children }: BulkBarProps) {
    if (count === 0) return null;

    return (
        <div className="px-5 py-3 border-b bg-indigo-50 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-indigo-700">{count} selected</span>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
                {children}
                <Button size="sm" variant="ghost" onClick={onClear} disabled={count === 0}>
                    Clear
                </Button>
            </div>
        </div>
    );
}