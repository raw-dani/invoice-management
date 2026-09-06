import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '../../lib/utils';

export interface Column<T> {
    header: string;
    accessor: (row: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    /** Enable a column of checkboxes for bulk selection. */
    selectable?: boolean;
    selectedKeys?: Set<string>;
    onToggleKey?: (key: string) => void;
    onToggleAll?: (keys: string[]) => void;
    /** Optional predicate to disable a row's checkbox (e.g. not bulk-actionable). */
    rowSelectable?: (row: T) => boolean;
}

export function DataTable<T>({
    columns,
    data,
    keyField,
    onRowClick,
    emptyMessage = 'No data',
    selectable = false,
    selectedKeys,
    onToggleKey,
    onToggleAll,
    rowSelectable,
}: DataTableProps<T>) {
    if (data.length === 0) {
        return <div className="text-center py-8 text-gray-500 text-sm">{emptyMessage}</div>;
    }

    const enabledKeys = rowSelectable
        ? data.filter(rowSelectable).map((row) => String(row[keyField]))
        : data.map((row) => String(row[keyField]));
    const allSelected = enabledKeys.length > 0 && enabledKeys.every((k) => selectedKeys?.has(k));

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {selectable && (
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    disabled={enabledKeys.length === 0}
                                    onChange={() => onToggleAll?.(enabledKeys)}
                                    className="rounded accent-indigo-600"
                                />
                            </th>
                        )}
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className={classNames(
                                    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                                    col.className
                                )}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row) => {
                        const key = String(row[keyField]);
                        const canSelect = rowSelectable ? rowSelectable(row) : true;
                        return (
                            <tr
                                key={key}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={classNames(onRowClick && 'hover:bg-gray-50 cursor-pointer')}
                            >
                                {selectable && (
                                    <td className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedKeys?.has(key) ?? false}
                                            disabled={!canSelect}
                                            onChange={() => onToggleKey?.(key)}
                                            className="rounded accent-indigo-600"
                                        />
                                    </td>
                                )}
                                {columns.map((col, i) => (
                                    <td key={i} className={classNames('px-4 py-3 text-sm text-gray-900', col.className)}>
                                        {col.accessor(row)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
    if (lastPage <= 1) return null;
    return (
        <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">Page {currentPage} of {lastPage}</div>
            <div className="flex gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export { Link };
