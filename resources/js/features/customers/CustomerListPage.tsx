import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomers, useDeleteCustomer, customerKeys } from './hooks';
import { customersApi, CustomerFilters } from '../../api/customers';
import { PageHeader, StatusBadge, EmptyState } from '../../components/ui/Display';
import { DataTable, Pagination } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';
import toast from '../../lib/toast';
import { useSelection } from '../../components/bulk/useSelection';
import { useBulkDelete, useBulkStatus } from '../../components/bulk/useBulk';
import { BulkBar } from '../../components/bulk/BulkBar';
import { reportBulkDelete, reportBulkResult } from '../../components/bulk/result';
import type { Customer } from '../../types';

export default function CustomerListPage() {
    const [filters, setFilters] = useState<CustomerFilters>({ page: 1, per_page: 15 });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const { data, isLoading } = useCustomers(filters);
    const deleteCustomer = useDeleteCustomer();
    const selection = useSelection();
    const bulkDelete = useBulkDelete((id) => deleteCustomer.mutateAsync(id), [customerKeys]);
    const bulkStatus = useBulkStatus(
        (payload) => customersApi.bulkStatus(payload.ids, payload.status as Customer['status']),
        [customerKeys]
    );

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteCustomer.mutateAsync(deleteId);
        toast.success('Customer deleted successfully.');
        setDeleteId(null);
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkDelete.mutateAsync(ids);
        setBulkDeleteOpen(false);
        selection.clear();
        reportBulkDelete(result.total, result.failed);
        if (result.failed === 0) toast.success(`${result.total} customer(s) deleted.`);
    };

    const handleBulkStatus = async (status: Customer['status']) => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkStatus.mutateAsync({ ids, status });
        selection.clear();
        reportBulkResult(`Set ${status}`, result.data.updated, ids.length - result.data.updated);
        if (result.data.updated > 0) toast.success(`${result.data.updated} customer(s) updated.`);
    };

    return (
        <>
            <PageHeader
                title="Customers"
                actions={<Link to="/customers/new"><Button>+ Add Customer</Button></Link>}
            />

            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-3 sm:px-5 border-b flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Search..."
                        className="w-full sm:max-w-xs"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                    <Select
                        className="w-full sm:max-w-[150px]"
                        defaultValue=""
                        onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
                    >
                        <option value="">All status</option>
                        <option value="lead">Lead</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                </div>

                <BulkBar count={selection.count} onClear={selection.clear}>
                    <Button size="sm" variant="secondary" loading={bulkStatus.isPending} onClick={() => handleBulkStatus('active')}>Set Active</Button>
                    <Button size="sm" variant="secondary" loading={bulkStatus.isPending} onClick={() => handleBulkStatus('lead')}>Set Lead</Button>
                    <Button size="sm" variant="secondary" loading={bulkStatus.isPending} onClick={() => handleBulkStatus('inactive')}>Set Inactive</Button>
                    <Button size="sm" variant="danger" disabled={bulkDelete.isPending} onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                </BulkBar>

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                ) : !data?.data.length ? (
                    <EmptyState
                        title="No customers yet"
                        message="Get started by adding your first customer."
                        action={<Link to="/customers/new"><Button>+ Add Customer</Button></Link>}
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
                                    header: 'Customer',
                                    accessor: (c) => (
                                        <Link to={`/customers/${c.id}`} className="text-indigo-600 hover:underline">
                                            {c.company_name}
                                        </Link>
                                    ),
                                },
                                { header: 'Number', accessor: (c) => c.customer_number },
                                { header: 'Contact', accessor: (c) => c.contact_name ?? '-' },
                                { header: 'Email', accessor: (c) => c.email ?? '-' },
                                { header: 'Status', accessor: (c) => <StatusBadge status={c.status} /> },
                                { header: 'Created', accessor: (c) => formatDate(c.created_at) },
                                {
                                    header: '',
                                    accessor: (c) => (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}
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
                title="Delete customer?"
                message="This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                danger
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                title={`Delete ${selection.count} customer(s)?`}
                message="This action cannot be undone."
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
                danger
                confirmText="Delete"
            />
        </>
    );
}
