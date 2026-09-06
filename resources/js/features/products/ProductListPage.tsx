import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useDeleteProduct, productKeys } from './hooks';
import { productsApi, ProductFilters } from '../../api/products';
import { PageHeader, EmptyState } from '../../components/ui/Display';
import { DataTable, Pagination } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatMoney, classNames } from '../../lib/utils';
import { useSelection } from '../../components/bulk/useSelection';
import { useBulkDelete, useBulkStatus } from '../../components/bulk/useBulk';
import { BulkBar } from '../../components/bulk/BulkBar';
import { reportBulkDelete, reportBulkResult } from '../../components/bulk/result';
import type { Product } from '../../types';

export default function ProductListPage() {
    const [filters, setFilters] = useState<ProductFilters>({ page: 1, per_page: 15 });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const { data, isLoading } = useProducts(filters);
    const deleteProduct = useDeleteProduct();
    const selection = useSelection();
    const bulkDelete = useBulkDelete((id) => deleteProduct.mutateAsync(id), [productKeys]);
    const bulkStatus = useBulkStatus(
        (payload) => productsApi.bulkStatus(payload.ids, payload.status as Product['status']),
        [productKeys]
    );

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteProduct.mutateAsync(deleteId);
        setDeleteId(null);
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkDelete.mutateAsync(ids);
        setBulkDeleteOpen(false);
        selection.clear();
        reportBulkDelete(result.total, result.failed);
    };

    const handleBulkStatus = async (status: Product['status']) => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkStatus.mutateAsync({ ids, status });
        selection.clear();
        reportBulkResult(`Set ${status}`, result.data.updated, ids.length - result.data.updated);
    };

    return (
        <>
            <PageHeader
                title="Products"
                actions={<Link to="/products/new"><Button>+ Add Product</Button></Link>}
            />

            <div className="bg-white shadow rounded-lg">
                <div className="px-5 py-3 border-b flex gap-3">
                    <Input
                        placeholder="Search..."
                        className="max-w-xs"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                    <Select
                        className="max-w-[150px]"
                        defaultValue=""
                        onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined, page: 1 })}
                    >
                        <option value="">All types</option>
                        <option value="one_time">One Time</option>
                        <option value="subscription">Subscription</option>
                    </Select>
                </div>

                <BulkBar count={selection.count} onClear={selection.clear}>
                    <Button size="sm" variant="secondary" loading={bulkStatus.isPending} onClick={() => handleBulkStatus('active')}>Set Active</Button>
                    <Button size="sm" variant="secondary" loading={bulkStatus.isPending} onClick={() => handleBulkStatus('inactive')}>Set Inactive</Button>
                    <Button size="sm" variant="danger" disabled={bulkDelete.isPending} onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                </BulkBar>

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                ) : !data?.data.length ? (
                    <EmptyState
                        title="No products yet"
                        action={<Link to="/products/new"><Button>+ Add Product</Button></Link>}
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
                                    header: 'Product',
                                    accessor: (p) => (
                                        <Link to={`/products/${p.id}`} className="text-indigo-600 hover:underline">
                                            {p.name}
                                        </Link>
                                    ),
                                },
                                { header: 'SKU', accessor: (p) => p.sku },
                                {
                                    header: 'Type',
                                    accessor: (p) => (
                                        <span className={classNames(
                                            'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                                            p.is_subscription ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        )}>
                                            {p.type_label}
                                        </span>
                                    ),
                                },
                                { header: 'Billing', accessor: (p) => p.billing_cycle_label },
                                { header: 'Price', accessor: (p) => formatMoney(p.price, p.currency) },
                                { header: 'Status', accessor: (p) => p.status },
                                {
                                    header: '',
                                    accessor: (p) => (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
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
                title="Delete product?"
                message="This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                danger
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                title={`Delete ${selection.count} product(s)?`}
                message="This action cannot be undone."
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
                danger
                confirmText="Delete"
            />
        </>
    );
}
