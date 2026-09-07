import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuotes, useDeleteQuote, quoteKeys } from './hooks';
import { quotesApi, QuoteFilters } from '../../api/quotes';
import { useCustomers } from '../customers/hooks';
import { PageHeader, StatusBadge, EmptyState } from '../../components/ui/Display';
import { DataTable, Pagination } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatMoney, formatDate } from '../../lib/utils';
import toast from '../../lib/toast';
import { useSelection } from '../../components/bulk/useSelection';
import { useBulkDelete, useBulkAction } from '../../components/bulk/useBulk';
import { BulkBar } from '../../components/bulk/BulkBar';
import { reportBulkDelete, reportBulkResult } from '../../components/bulk/result';

const STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'];

export default function QuoteListPage() {
    const [filters, setFilters] = useState<QuoteFilters>({ page: 1, per_page: 15 });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const { data, isLoading } = useQuotes(filters);
    const { data: customersData } = useCustomers({ per_page: 200 });
    const deleteQuote = useDeleteQuote();
    const selection = useSelection();
    const bulkDelete = useBulkDelete((id) => deleteQuote.mutateAsync(id), [quoteKeys]);
    const bulkAction = useBulkAction(
        (payload) => quotesApi.bulkAction(payload.ids, payload.action as 'mark_as_expired'),
        [quoteKeys]
    );

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteQuote.mutateAsync(deleteId);
        toast.success('Quote deleted successfully.');
        setDeleteId(null);
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkDelete.mutateAsync(ids);
        setBulkDeleteOpen(false);
        selection.clear();
        reportBulkDelete(result.total, result.failed);
        if (result.failed === 0) toast.success(`${result.total} quote(s) deleted.`);
    };

    const handleBulkAction = async (action: 'mark_as_expired') => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkAction.mutateAsync({ ids, action });
        selection.clear();
        reportBulkResult(action.replace(/_/g, ' '), result.data.processed ?? 0, result.data.failed ?? 0);
        if ((result.data.processed ?? 0) > 0) toast.success(`${result.data.processed} quote(s) updated.`);
    };

    return (
        <>
            <PageHeader
                title="Quotes"
                actions={<Link to="/quotes/new"><Button>+ Create Quote</Button></Link>}
            />

            <div className="bg-white shadow rounded-lg">
                <div className="px-5 py-3 border-b flex gap-3">
                    <Input
                        placeholder="Search..."
                        className="max-w-xs"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                    <Select
                        className="max-w-[180px]"
                        defaultValue=""
                        onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
                    >
                        <option value="">All status</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </Select>
                    <Select
                        className="max-w-[180px]"
                        defaultValue=""
                        onChange={(e) => setFilters({ ...filters, customer_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                    >
                        <option value="">All customers</option>
                        {customersData?.data.map((c) => (
                            <option key={c.id} value={c.id}>{c.company_name}</option>
                        ))}
                    </Select>
                </div>

                <BulkBar count={selection.count} onClear={selection.clear}>
                    <Button size="sm" variant="secondary" disabled={bulkAction.isPending} onClick={() => handleBulkAction('mark_as_expired')}>Mark as Expired</Button>
                    <Button size="sm" variant="danger" disabled={bulkDelete.isPending} onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                </BulkBar>

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                ) : !data?.data.length ? (
                    <EmptyState
                        title="No quotes yet"
                        action={<Link to="/quotes/new"><Button>+ Create Quote</Button></Link>}
                    />
                ) : (
                    <>
                        <DataTable
                            data={data.data}
                            keyField="id"
                            selectable
                            selectedKeys={selection.selected}
                            onToggleKey={(key) => selection.toggle(key, true)}
                            onToggleAll={selection.toggleAll}
                            columns={[
                                {
                                    header: 'Number',
                                    accessor: (q) => (
                                        <Link to={`/quotes/${q.id}`} className="text-indigo-600 hover:underline font-medium">
                                            {q.quote_number}
                                        </Link>
                                    ),
                                },
                                { header: 'Customer', accessor: (q) => q.customer?.company_name ?? '-' },
                                { header: 'Date', accessor: (q) => formatDate(q.quote_date) },
                                { header: 'Valid Until', accessor: (q) => q.valid_until ? formatDate(q.valid_until) : '-' },
                                { header: 'Total', accessor: (q) => formatMoney(q.total, q.currency) },
                                { header: 'Status', accessor: (q) => <StatusBadge status={q.status} /> },
                                {
                                    header: '',
                                    accessor: (q) => (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteId(q.id); }}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    ),
                                    className: 'text-right',
                                },
                            ]}
                        />
                        <div className="px-5 py-3">
                            <Pagination
                                currentPage={data.meta.current_page}
                                lastPage={data.meta.last_page}
                                onPageChange={(p) => setFilters({ ...filters, page: p })}
                            />
                        </div>
                    </>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteId}
                title="Delete quote?"
                message="This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                danger
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                title={`Delete ${selection.count} quote(s)?`}
                message="This action cannot be undone."
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
                danger
                confirmText="Delete"
            />
        </>
    );
}
