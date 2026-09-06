import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptions, useDeleteSubscription, subscriptionKeys } from './hooks';
import { subscriptionsApi, SubscriptionFilters } from '../../api/subscriptions';
import { EmptyState, PageHeader, StatusBadge } from '../../components/ui/Display';
import { DataTable, Pagination } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';
import { useSelection } from '../../components/bulk/useSelection';
import { useBulkDelete, useBulkAction } from '../../components/bulk/useBulk';
import { BulkBar } from '../../components/bulk/BulkBar';
import { reportBulkDelete, reportBulkResult } from '../../components/bulk/result';

export default function SubscriptionListPage() {
    const [filters, setFilters] = useState<SubscriptionFilters>({ page: 1, per_page: 15 });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const { data, isLoading } = useSubscriptions(filters);
    const deleteMutation = useDeleteSubscription();
    const selection = useSelection();
    const bulkDelete = useBulkDelete((id) => deleteMutation.mutateAsync(id), [subscriptionKeys]);
    const bulkAction = useBulkAction(
        (payload) => subscriptionsApi.bulkAction(payload.ids, payload.action as 'pause' | 'resume' | 'cancel'),
        [subscriptionKeys]
    );

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkDelete.mutateAsync(ids);
        setBulkDeleteOpen(false);
        selection.clear();
        reportBulkDelete(result.total, result.failed);
    };

    const handleBulkAction = async (action: 'pause' | 'resume' | 'cancel') => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkAction.mutateAsync({ ids, action });
        selection.clear();
        reportBulkResult(action, result.data.processed ?? 0, result.data.failed ?? 0);
    };

    return (
        <>
            <PageHeader title="Subscriptions" actions={<Link to="/subscriptions/new"><Button>+ Add Subscription</Button></Link>} />
            <div className="bg-white shadow rounded-lg">
                <div className="px-5 py-3 border-b flex gap-3">
                    <Input placeholder="Search number..." className="max-w-xs" onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
                    <Select className="max-w-[150px]" defaultValue="" onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}>
                        <option value="">All statuses</option>
                        <option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option>
                    </Select>
                </div>
                <BulkBar count={selection.count} onClear={selection.clear}>
                    <Button size="sm" variant="secondary" disabled={bulkAction.isPending} onClick={() => handleBulkAction('pause')}>Pause</Button>
                    <Button size="sm" variant="secondary" disabled={bulkAction.isPending} onClick={() => handleBulkAction('resume')}>Resume</Button>
                    <Button size="sm" variant="secondary" disabled={bulkAction.isPending} onClick={() => handleBulkAction('cancel')}>Cancel</Button>
                    <Button size="sm" variant="danger" disabled={bulkDelete.isPending} onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                </BulkBar>
                {isLoading ? <div className="p-8 text-center text-sm text-gray-500">Loading...</div> : !data?.data.length ? <EmptyState title="No subscriptions yet" action={<Link to="/subscriptions/new"><Button>+ Add Subscription</Button></Link>} /> : (
                    <>
                        <DataTable data={data.data} keyField="id" selectable selectedKeys={selection.selected} onToggleKey={(key) => selection.toggle(key, true)} onToggleAll={selection.toggleAll} columns={[
                            { header: 'Subscription', accessor: (s) => <Link to={`/subscriptions/${s.id}`} className="text-indigo-600 hover:underline">{s.subscription_number}</Link> },
                            { header: 'Customer', accessor: (s) => s.customer?.company_name ?? '-' },
                            { header: 'Cycle', accessor: (s) => s.billing_cycle.replace('_', ' ') },
                            { header: 'Next billing', accessor: (s) => formatDate(s.next_billing_date) },
                            { header: 'Status', accessor: (s) => <StatusBadge status={s.status} /> },
                            { header: '', accessor: (s) => <button className="text-red-600 text-sm" onClick={() => setDeleteId(s.id)}>Delete</button>, className: 'text-right' },
                        ]} />
                        <div className="px-5 py-3"><Pagination currentPage={data.meta.current_page} lastPage={data.meta.last_page} onPageChange={(page) => setFilters({ ...filters, page })} /></div>
                    </>
                )}
            </div>
            <ConfirmDialog open={!!deleteId} title="Delete subscription?" message="This action cannot be undone." danger onCancel={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await deleteMutation.mutateAsync(deleteId); setDeleteId(null); }} />
            <ConfirmDialog open={bulkDeleteOpen} title={`Delete ${selection.count} subscription(s)?`} message="This action cannot be undone." danger confirmText="Delete" onCancel={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} />
        </>
    );
}