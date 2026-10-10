import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, useDeleteInvoice, invoiceKeys } from './hooks';
import { invoicesApi, InvoiceFilters } from '../../api/invoices';
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
import { WhatsAppShareModal, WhatsAppShareData } from '../../components/WhatsAppShareModal';

const STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void'];

export default function InvoiceListPage() {
    const [filters, setFilters] = useState<InvoiceFilters>({ page: 1, per_page: 15 });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [activeShare, setActiveShare] = useState<WhatsAppShareData | null>(null);

    const { data, isLoading } = useInvoices(filters);
    const { data: customersData } = useCustomers({ per_page: 200 });
    const deleteInvoice = useDeleteInvoice();
    const selection = useSelection();
    const bulkDelete = useBulkDelete((id) => deleteInvoice.mutateAsync(id), [invoiceKeys]);
    const bulkAction = useBulkAction(
        (payload) => invoicesApi.bulkAction(payload.ids, payload.action as 'mark_as_sent' | 'void'),
        [invoiceKeys]
    );

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteInvoice.mutateAsync(deleteId);
        toast.success('Invoice deleted successfully.');
        setDeleteId(null);
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkDelete.mutateAsync(ids);
        setBulkDeleteOpen(false);
        selection.clear();
        reportBulkDelete(result.total, result.failed);
        if (result.failed === 0) toast.success(`${result.total} invoice(s) deleted.`);
    };

    const handleBulkAction = async (action: 'mark_as_sent' | 'void') => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkAction.mutateAsync({ ids, action });
        selection.clear();
        reportBulkResult(action.replace(/_/g, ' '), result.data.processed ?? 0, result.data.failed ?? 0);
        if ((result.data.processed ?? 0) > 0) toast.success(`${result.data.processed} invoice(s) updated.`);
    };

    return (
        <>
            <PageHeader
                title="Invoices"
                actions={<Link to="/invoices/new"><Button>+ Create Invoice</Button></Link>}
            />

            <div className="bg-white shadow rounded-lg">
                <div className="px-5 py-3 border-b flex gap-3">
                    <Input
                        placeholder="Search invoice number..."
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
                    <Button size="sm" variant="secondary" disabled={bulkAction.isPending} onClick={() => handleBulkAction('mark_as_sent')}>Mark as Sent</Button>
                    <Button size="sm" variant="secondary" disabled={bulkAction.isPending} onClick={() => handleBulkAction('void')}>Void</Button>
                    <Button size="sm" variant="danger" disabled={bulkDelete.isPending} onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                </BulkBar>

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                ) : !data?.data.length ? (
                    <EmptyState
                        title="No invoices yet"
                        action={<Link to="/invoices/new"><Button>+ Create Invoice</Button></Link>}
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
                                    accessor: (i) => (
                                        <Link to={`/invoices/${i.id}`} className="text-indigo-600 hover:underline font-medium">
                                            {i.invoice_number}
                                        </Link>
                                    ),
                                },
                                { header: 'Customer', accessor: (i) => i.customer?.company_name ?? '-' },
                                { header: 'Date', accessor: (i) => formatDate(i.invoice_date) },
                                { header: 'Due', accessor: (i) => formatDate(i.due_date) },
                                { header: 'Total', accessor: (i) => formatMoney(i.total, i.currency) },
                                { header: 'Balance', accessor: (i) => formatMoney(i.balance, i.currency) },
                                { header: 'Status', accessor: (i) => <StatusBadge status={i.status} /> },
                                {
                                    header: '',
                                    accessor: (i) => (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveShare({
                                                        entityType: 'invoice',
                                                        id: i.id,
                                                        number: i.invoice_number,
                                                        total: i.total,
                                                        balance: i.balance,
                                                        currency: i.currency,
                                                        date: i.invoice_date,
                                                        dueDate: i.due_date,
                                                        customerName: i.customer?.company_name || 'Pelanggan',
                                                        customerPhone: i.customer?.phone,
                                                        publicToken: i.public_token,
                                                    });
                                                }}
                                                className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition text-sm font-medium"
                                                title="Kirim via WhatsApp"
                                            >
                                                💬 WA
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(i.id); }}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
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
                title="Delete invoice?"
                message="This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                danger
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                title={`Delete ${selection.count} invoice(s)?`}
                message="This action cannot be undone. Only draft or cancelled invoices can be deleted."
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
                danger
                confirmText="Delete"
            />

            <WhatsAppShareModal
                open={!!activeShare}
                onClose={() => setActiveShare(null)}
                data={activeShare}
            />
        </>
    );
}
