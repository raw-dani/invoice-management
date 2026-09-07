import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, ReportFilters } from '../../api/reports';
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from '../../components/ui/Display';
import { Input, Select } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { formatMoney, formatDate } from '../../lib/utils';
import toast from '../../lib/toast';

type Tab = 'revenue' | 'invoices' | 'customers' | 'subscriptions';

const TABS: { key: Tab; label: string }[] = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'customers', label: 'Customers' },
    { key: 'subscriptions', label: 'Subscriptions' },
];

export default function ReportsPage() {
    const [tab, setTab] = useState<Tab>('revenue');
    const [filters, setFilters] = useState<ReportFilters>({ group_by: 'month' });

    const report = useQuery({
        queryKey: ['reports', tab, filters],
        queryFn: () => tab === 'subscriptions' ? reportsApi.subscriptions() : reportsApi[tab](filters),
    });

    const updateDate = (key: 'from' | 'to', value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    };

    const updateGroupBy = (value: string) => {
        setFilters((prev) => ({ ...prev, group_by: value }));
    };

    if (report.isError) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-red-600">Failed to load report data. Please try again.</p>
                <Button className="mt-4" variant="secondary" onClick={() => report.refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader title="Reports" subtitle="Review revenue, invoice, customer, and subscription performance." />

            <div className="flex flex-wrap gap-2 mb-4">
                {TABS.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setTab(item.key)}
                        className={`px-3 py-2 text-sm rounded-md ${
                            tab === item.key
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 border hover:bg-gray-50'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <Card className="mb-6">
                <CardBody className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <Input
                            type="date"
                            value={filters.from ?? ''}
                            onChange={(e) => updateDate('from', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <Input
                            type="date"
                            value={filters.to ?? ''}
                            onChange={(e) => updateDate('to', e.target.value)}
                        />
                    </div>
                    {tab === 'revenue' && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Group by</label>
                            <Select value={filters.group_by} onChange={(e) => updateGroupBy(e.target.value)}>
                                <option value="month">Month</option>
                                <option value="customer">Customer</option>
                                <option value="product">Product</option>
                            </Select>
                        </div>
                    )}
                </CardBody>
            </Card>

            {report.isLoading ? (
                <div className="p-8 text-center text-sm text-gray-500">Loading report...</div>
            ) : tab === 'revenue' ? (
                <RevenueReport data={report.data} />
            ) : tab === 'invoices' ? (
                <InvoiceReport data={report.data} />
            ) : tab === 'customers' ? (
                <CustomerReport data={report.data} />
            ) : (
                <SubscriptionReport data={report.data} />
            )}
        </>
    );
}

function RevenueReport({ data }: { data: any }) {
    const rows = data?.rows ?? [];
    const max = Math.max(...rows.map((r: any) => Number(r.revenue)), 1);
    const currency = data?.currency ?? 'IDR';

    if (!rows.length) {
        return (
            <Card>
                <CardHeader><h3 className="font-medium">Revenue</h3></CardHeader>
                <CardBody>
                    <EmptyState title="No revenue data" message="There are no payments recorded for the selected period." />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><h3 className="font-medium">Revenue</h3></CardHeader>
            <CardBody>
                <div className="space-y-3">
                    {rows.map((row: any) => (
                        <div key={row.label}>
                            <div className="flex justify-between text-sm mb-1">
                                <span>{row.label}</span>
                                <span className="font-medium">{formatMoney(Number(row.revenue), currency)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded">
                                <div
                                    className="h-2 bg-indigo-500 rounded"
                                    style={{ width: `${Math.max((Number(row.revenue) / max) * 100, 2)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}

function InvoiceReport({ data }: { data: any }) {
    const rows = data?.rows ?? [];

    if (!rows.length) {
        return (
            <Card>
                <CardHeader><h3 className="font-medium">Invoices</h3></CardHeader>
                <CardBody>
                    <EmptyState title="No invoice data" message="There are no invoices for the selected period." />
                </CardBody>
            </Card>
        );
    }

    return (
        <ReportTable
            title="Invoices"
            headers={['Status', 'Count', 'Total', 'Balance']}
            rows={rows.map((r: any) => [
                r.status,
                r.count,
                formatMoney(Number(r.total)),
                formatMoney(Number(r.balance)),
            ])}
        />
    );
}

function CustomerReport({ data }: { data: any }) {
    const statusRows = data?.status ?? [];
    const balanceRows = data?.balances ?? [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportTable
                title="Customers by Status"
                headers={['Status', 'Count']}
                rows={statusRows.map((r: any) => [r.status, r.count])}
            />
            <ReportTable
                title="Outstanding Balances"
                headers={['Customer', 'Balance']}
                rows={balanceRows.map((r: any) => [r.customer, formatMoney(Number(r.balance))])}
            />
        </div>
    );
}

function SubscriptionReport({ data }: { data: any }) {
    const upcoming = data?.upcoming ?? [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Metric label="Active" value={data?.active ?? 0} />
                <Metric label="Paused" value={data?.paused ?? 0} />
                <Metric label="MRR" value={formatMoney(Number(data?.mrr ?? 0))} />
            </div>
            {upcoming.length > 0 && (
                <Card>
                    <CardHeader><h3 className="font-medium">Upcoming Billings</h3></CardHeader>
                    <CardBody>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-gray-500">
                                        <th className="pb-3 pr-6">Subscription</th>
                                        <th className="pb-3 pr-6">Billing Cycle</th>
                                        <th className="pb-3 pr-6">Next Billing</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {upcoming.map((item: any) => (
                                        <tr key={item.subscription_number}>
                                            <td className="py-3 pr-6">{item.subscription_number}</td>
                                            <td className="py-3 pr-6 capitalize">{item.billing_cycle?.replace('_', ' ')}</td>
                                            <td className="py-3 pr-6">{formatDate(item.next_billing_date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <Card>
            <CardBody>
                <div className="text-xs uppercase text-gray-500">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-indigo-600">{value}</div>
            </CardBody>
        </Card>
    );
}

function ReportTable({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
    if (!rows.length) {
        return (
            <Card>
                <CardHeader><h3 className="font-medium">{title}</h3></CardHeader>
                <CardBody>
                    <EmptyState title="No data" message="There is no data available for this report." />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><h3 className="font-medium">{title}</h3></CardHeader>
            <CardBody>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-gray-500">
                                {headers.map((header) => (
                                    <th key={header} className="pb-3 pr-6">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((row, index) => (
                                <tr key={index}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="py-3 pr-6">{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardBody>
        </Card>
    );
}
