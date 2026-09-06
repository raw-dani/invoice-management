import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCustomer } from './hooks';
import { customersApi } from '../../api/customers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, PageHeader, StatusBadge } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { formatDate, formatMoney } from '../../lib/utils';
import { useState } from 'react';

const TABS = ['Invoices', 'Quotes', 'Subscriptions', 'Payments', 'Activity'] as const;
type Tab = (typeof TABS)[number];

export default function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [convertOpen, setConvertOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [currency, setCurrency] = useState('IDR');
    const [price, setPrice] = useState('0');
    const [startDate] = useState(new Date().toISOString().slice(0, 10));
    const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().slice(0, 10));
    const convert = useMutation({
        mutationFn: () => customersApi.convertToSubscription(Number(id), {
            billing_cycle: billingCycle,
            start_date: startDate,
            next_billing_date: nextBillingDate,
            invoice_due_days: 30,
            currency,
            items: [{ description: 'Recurring subscription', quantity: 1, unit_price: Number(price), tax_rate: 0 }],
        }),
        onSuccess: (subscription) => { queryClient.invalidateQueries({ queryKey: ['customers'] }); navigate(`/subscriptions/${subscription.id}`); },
    });
    const { data: customer, isLoading } = useCustomer(Number(id));
    const [tab, setTab] = useState<Tab>('Invoices');
    const { data: overview } = useQuery({
        queryKey: ['customers', 'detail', Number(id), 'overview'],
        queryFn: () => customersApi.overview(Number(id)),
        enabled: !!id,
    });

    if (isLoading) return <div>Loading...</div>;
    if (!customer) return <div>Not found</div>;

    return (
        <>
            <PageHeader
                title={customer.company_name}
                subtitle={`${customer.customer_number} · ${customer.email ?? 'No email'}`}
                actions={
                    <>
                        <Link to={`/invoices/new?customer_id=${customer.id}`}>
                            <Button variant="secondary" size="sm">+ Invoice</Button>
                        </Link>
                        <Link to={`/quotes/new?customer_id=${customer.id}`}>
                            <Button variant="secondary" size="sm">+ Quote</Button>
                        </Link>
                        <Link to={`/customers/${customer.id}/edit`}>
                            <Button size="sm">Edit</Button>
                        </Link>
                        <Button size="sm" onClick={() => setConvertOpen(true)}>Convert to Subscription</Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><h3 className="font-medium">Overview</h3></CardHeader>
                    <CardBody>
                        <dl className="space-y-2 text-sm">
                            <Row label="Status"><StatusBadge status={customer.status} /></Row>
                            <Row label="Contact">{customer.contact_name ?? '-'}</Row>
                            <Row label="Phone">{customer.phone ?? '-'}</Row>
                            <Row label="Tax Number">{customer.tax_number ?? '-'}</Row>
                            <Row label="Address">{customer.address ?? '-'}</Row>
                            <Row label="City">{customer.city ?? '-'}, {customer.province ?? '-'}</Row>
                            <Row label="Country">{customer.country ?? '-'}</Row>
                            <Row label="Created">{formatDate(customer.created_at)}</Row>
                        </dl>
                    </CardBody>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader><h3 className="font-medium">Notes</h3></CardHeader>
                    <CardBody>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {customer.notes ?? 'No notes.'}
                        </p>
                    </CardBody>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <div className="flex gap-1 flex-wrap">
                        {TABS.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-3 py-1.5 rounded text-sm ${tab === t ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardBody>
                    {tab === 'Invoices' && (
                        <RelatedTable
                            rows={overview?.invoices}
                            empty="No invoices yet."
                            linkRow={(r) => `/invoices/${r.id}`}
                            columns={['Number', 'Date', 'Total', 'Status']}
                            render={(i) => [
                                i.invoice_number,
                                formatDate(i.invoice_date),
                                formatMoney(i.total, i.currency),
                                <StatusBadge key="s" status={i.status} />,
                            ]}
                        />
                    )}
                    {tab === 'Quotes' && (
                        <RelatedTable
                            rows={overview?.quotes}
                            empty="No quotes yet."
                            linkRow={(r) => `/quotes/${r.id}`}
                            columns={['Number', 'Valid until', 'Total', 'Status']}
                            render={(q) => [
                                q.quote_number,
                                q.valid_until ? formatDate(q.valid_until) : '-',
                                formatMoney(q.total, q.currency),
                                <StatusBadge key="s" status={q.status} />,
                            ]}
                        />
                    )}
                    {tab === 'Subscriptions' && (
                        <RelatedTable
                            rows={overview?.subscriptions}
                            empty="No subscriptions yet."
                            linkRow={(r) => `/subscriptions/${r.id}`}
                            columns={['Number', 'Cycle', 'Next billing', 'Status']}
                            render={(s) => [
                                s.subscription_number,
                                s.billing_cycle,
                                s.next_billing_date ? formatDate(s.next_billing_date) : '-',
                                <StatusBadge key="s" status={s.status} />,
                            ]}
                        />
                    )}
                    {tab === 'Payments' && (
                        <RelatedTable
                            rows={overview?.payments}
                            empty="No payments yet."
                            linkRow={(r) => `/payments/${r.id}`}
                            columns={['Number', 'Date', 'Amount', 'Method']}
                            render={(p) => [
                                p.payment_number,
                                formatDate(p.payment_date),
                                formatMoney(p.amount, p.currency),
                                p.payment_method.replace('_', ' '),
                            ]}
                        />
                    )}
                    {tab === 'Activity' && (
                        <RelatedTable
                            rows={overview?.activity}
                            empty="No activity yet."
                            columns={['When', 'Action', 'Description']}
                            render={(a) => [formatDate(a.created_at), a.action, a.description]}
                        />
                    )}
                </CardBody>
            </Card>
            {convertOpen && <div className="fixed inset-0 z-40 flex items-center justify-center px-4"><div className="fixed inset-0 bg-black/40" onClick={() => setConvertOpen(false)} /><div className="relative w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"><h2 className="text-lg font-medium">Convert to Subscription</h2><p className="mt-1 text-sm text-gray-500">Create an active recurring subscription for {customer.company_name}.</p><div className="mt-4 grid gap-3"><label className="text-sm">Billing cycle<select className="mt-1 block w-full rounded-md border-gray-300" value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="semi_annual">Semi Annual</option><option value="yearly">Yearly</option></select></label><label className="text-sm">First billing date<input className="mt-1 block w-full rounded-md border-gray-300" type="date" value={nextBillingDate} onChange={(e) => setNextBillingDate(e.target.value)} /></label><label className="text-sm">Recurring amount<input className="mt-1 block w-full rounded-md border-gray-300" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></label><label className="text-sm">Currency<select className="mt-1 block w-full rounded-md border-gray-300" value={currency} onChange={(e) => setCurrency(e.target.value)}><option>IDR</option><option>USD</option><option>SGD</option><option>EUR</option><option>AUD</option></select></label></div><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setConvertOpen(false)}>Cancel</Button><Button loading={convert.isPending} onClick={() => convert.mutate()}>Convert</Button></div></div></div>}
        </>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900 text-right">{children}</dd>
        </div>
    );
}

function RelatedTable<T extends { id: number }>({
    rows, columns, render, linkRow, empty,
}: {
    rows?: T[] | null;
    columns: string[];
    render: (row: T) => React.ReactNode[];
    linkRow?: (row: T) => string;
    empty: string;
}) {
    if (rows === undefined) return <div className="text-sm text-gray-500">Loading...</div>;
    if (!rows || rows.length === 0) return <div className="text-sm text-gray-500">{empty}</div>;
    const data = rows;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase border-b">
                        {columns.map((c) => <th key={c} className="py-2 pr-4 font-medium">{c}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => {
                        const cells = render(row);
                        return (
                            <tr key={row.id} className="border-b last:border-0">
                                {cells.map((cell, idx) => {
                                    if (idx === 0 && linkRow) {
                                        return <td key={idx} className="py-2 pr-4"><Link to={linkRow(row)} className="text-indigo-600 hover:underline">{cell}</Link></td>;
                                    }
                                    return <td key={idx} className="py-2 pr-4">{cell}</td>;
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
