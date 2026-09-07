import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { formatMoney, formatDate } from '../../lib/utils';
import { StatusBadge, Card, CardBody, PageHeader } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';

export default function DashboardPage() {
    const [filters, setFilters] = useState({ from: '', to: '' });
    const { data: summary } = useQuery({
        queryKey: ['dashboard', 'summary', filters],
        queryFn: () => dashboardApi.summary(filters),
    });
    const { data: recentInvoices } = useQuery({
        queryKey: ['dashboard', 'recent-invoices', filters],
        queryFn: () => dashboardApi.recentInvoices(filters),
    });
    const { data: overdueInvoices } = useQuery({
        queryKey: ['dashboard', 'overdue-invoices', filters],
        queryFn: () => dashboardApi.overdueInvoices(filters),
    });
    const { data: upcomingBilling } = useQuery({
        queryKey: ['dashboard', 'upcoming-billing', filters],
        queryFn: () => dashboardApi.upcomingBilling(filters),
    });

    const updateDate = (key: 'from' | 'to', value: string) => setFilters((prev) => ({ ...prev, [key]: value }));

    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle={`Welcome back. ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                actions={
                    <>
                        <Link to="/invoices/new"><Button size="sm">+ Invoice</Button></Link>
                        <Link to="/quotes/new"><Button size="sm" variant="secondary">+ Quote</Button></Link>
                    </>
                }
            />
            <Card className="mb-6">
                <CardBody className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <Input type="date" value={filters.from} onChange={(e) => updateDate('from', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <Input type="date" value={filters.to} onChange={(e) => updateDate('to', e.target.value)} />
                    </div>
                </CardBody>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <StatCard label="Total Revenue" value={formatMoney(summary?.total_revenue ?? 0)} accent="text-green-600" />
                <StatCard label="Outstanding" value={formatMoney(summary?.outstanding ?? 0)} accent="text-blue-600" />
                <StatCard label="Overdue" value={String(summary?.overdue_count ?? 0)} accent="text-red-600" />
                <StatCard label="Customers" value={String(summary?.customers_count ?? 0)} accent="text-indigo-600" />
                <StatCard label="MRR" value={formatMoney(summary?.mrr ?? 0)} accent="text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="px-5 py-4 border-b">
                        <h3 className="font-medium">Recent Invoices</h3>
                    </div>
                    <div className="divide-y">
                        {recentInvoices?.length ? recentInvoices.map((inv) => (
                            <Link
                                key={inv.id}
                                to={`/invoices/${inv.id}`}
                                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                            >
                                <div>
                                    <div className="text-sm font-medium text-indigo-600">{inv.invoice_number}</div>
                                    <div className="text-xs text-gray-500">{inv.customer?.company_name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">{formatMoney(inv.total, inv.currency)}</div>
                                    <StatusBadge status={inv.status} className="mt-1" />
                                </div>
                            </Link>
                        )) : <div className="px-5 py-8 text-center text-sm text-gray-500">No invoices yet</div>}
                    </div>
                </Card>

                <Card>
                    <div className="px-5 py-4 border-b">
                        <h3 className="font-medium">Overdue Invoices</h3>
                    </div>
                    <div className="divide-y">
                        {overdueInvoices?.length ? overdueInvoices.map((inv) => (
                            <Link
                                key={inv.id}
                                to={`/invoices/${inv.id}`}
                                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                            >
                                <div>
                                    <div className="text-sm font-medium">{inv.invoice_number}</div>
                                    <div className="text-xs text-gray-500">Due {formatDate(inv.due_date)}</div>
                                </div>
                                <div className="text-sm font-medium text-red-600">
                                    {formatMoney(inv.balance, inv.currency)}
                                </div>
                            </Link>
                        )) : <div className="px-5 py-8 text-center text-sm text-gray-500">Nothing overdue 🎉</div>}
                    </div>
                </Card>
            </div>

            <Card className="mt-6">
                <div className="px-5 py-4 border-b"><h3 className="font-medium">Upcoming Billing</h3></div>
                <div className="divide-y">
                    {upcomingBilling?.length ? upcomingBilling.map((billing) => (
                        <Link key={billing.id} to={`/subscriptions/${billing.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                            <div><div className="text-sm font-medium text-indigo-600">{billing.subscription_number}</div><div className="text-xs text-gray-500">{billing.customer ?? 'Unknown customer'} · Due {formatDate(billing.next_billing_date)}</div></div>
                            <div className="text-sm font-medium">{formatMoney(billing.amount, billing.currency)}</div>
                        </Link>
                    )) : <div className="px-5 py-8 text-center text-sm text-gray-500">No billing due in the next 30 days</div>}
                </div>
            </Card>
        </>
    );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
    return (
        <Card>
            <div className="px-5 py-4">
                <div className="text-xs uppercase text-gray-500 tracking-wide">{label}</div>
                <div className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</div>
            </div>
        </Card>
    );
}
